export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Returns current date components in Asia/Kolkata timezone (IST)
 */
export function getISTDateDetails(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year,
    monthIndex: map.month - 1, // 0-indexed (0 = Jan, 8 = Sept)
    monthName: MONTH_NAMES[map.month - 1],
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second
  };
}

/**
 * Calculates late fee and status for a specific fee month based on IST time.
 */
export function calculateMonthFeeDetails({
  monthName,
  year,
  baseMonthlyFee,
  isPaid = false,
  isPending = false,
  isWaived = false,
  dueDay = 10,
  lateFeeAmount = 100
}: {
  monthName: string;
  year: number;
  baseMonthlyFee: number;
  isPaid?: boolean;
  isPending?: boolean;
  isWaived?: boolean;
  dueDay?: number;
  lateFeeAmount?: number;
}) {
  const ist = getISTDateDetails();
  const targetMonthIndex = MONTH_NAMES.indexOf(monthName);

  if (targetMonthIndex === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }

  // Determine whether this target month is overdue based on IST
  // Overdue condition:
  // 1. Year < Current IST Year
  // 2. Year === Current IST Year AND MonthIndex < Current IST MonthIndex
  // 3. Year === Current IST Year AND MonthIndex === Current IST MonthIndex AND IST Day > dueDay (10th)
  let isOverdue = false;

  if (year < ist.year) {
    isOverdue = true;
  } else if (year === ist.year) {
    if (targetMonthIndex < ist.monthIndex) {
      isOverdue = true;
    } else if (targetMonthIndex === ist.monthIndex && ist.day > dueDay) {
      isOverdue = true;
    }
  }

  const lateFee = (isOverdue && !isWaived) ? lateFeeAmount : 0;
  const totalAmount = baseMonthlyFee + lateFee;

  let status = "UNPAID";
  if (isPaid) {
    status = "PAID";
  } else if (isPending) {
    status = "PAYMENT_PENDING";
  } else if (isOverdue) {
    status = "OVERDUE";
  }

  return {
    month: monthName,
    year,
    baseAmount: baseMonthlyFee,
    lateFee,
    totalAmount,
    isOverdue,
    isWaived,
    status
  };
}

/**
 * Generates and reconciles month-by-month fee details for a student.
 */
export function generateStudentFeeTimeline({
  student,
  existingPayments,
  defaultMonthlyFee = 700,
  lateFeeAmount = 100,
  dueDay = 10
}: {
  student: {
    id: string;
    monthlyFee?: number | null;
    createdAt?: Date | string | null;
    status?: string;
  };
  existingPayments: Array<{
    id: string;
    month: string;
    year: number;
    baseAmount: number;
    lateFee: number;
    totalAmount: number;
    status: string;
    lateFeeWaived?: boolean;
    waiverReason?: string | null;
    paymentMethod?: string;
    paymentReference?: string | null;
    utr?: string | null;
    paidAt?: Date | string | null;
    createdAt?: Date | string | null;
  }>;
  defaultMonthlyFee?: number;
  lateFeeAmount?: number;
  dueDay?: number;
}) {
  const ist = getISTDateDetails();
  const baseMonthlyFee = student.monthlyFee && student.monthlyFee > 0 ? student.monthlyFee : defaultMonthlyFee;

  // Determine starting point: from student's join date or up to 6 months prior
  let startYear = ist.year;
  let startMonthIndex = ist.monthIndex;

  if (student.createdAt) {
    const createdDate = new Date(student.createdAt);
    const createdIST = getISTDateDetails(createdDate);
    startYear = createdIST.year;
    startMonthIndex = createdIST.monthIndex;
  } else {
    // Default to 5 months before current month
    startMonthIndex = ist.monthIndex - 5;
    if (startMonthIndex < 0) {
      startMonthIndex += 12;
      startYear -= 1;
    }
  }

  // Collect all months from start (or oldest payment) to current month
  // Find oldest payment if existing
  for (const p of existingPayments) {
    const pIdx = MONTH_NAMES.indexOf(p.month);
    if (pIdx !== -1) {
      if (p.year < startYear || (p.year === startYear && pIdx < startMonthIndex)) {
        startYear = p.year;
        startMonthIndex = pIdx;
      }
    }
  }

  const timeline = [];
  let currYear = startYear;
  let currMonthIdx = startMonthIndex;

  while (currYear < ist.year || (currYear === ist.year && currMonthIdx <= ist.monthIndex)) {
    const monthName = MONTH_NAMES[currMonthIdx];

    // Find existing DB record
    const existing = existingPayments.find(
      (p) => p.month === monthName && p.year === currYear
    );

    const isPaid = existing ? (existing.status === "PAID" || existing.status === "Verified") : false;
    const isAwaiting = existing ? (existing.status === "AWAITING_CONFIRMATION" || existing.status === "PAYMENT_CREATED") : false;
    const isPending = existing ? (existing.status === "PAYMENT_PENDING" || existing.status === "Pending") : false;
    const isWaived = existing?.lateFeeWaived ?? false;

    // Use historical base amount if already recorded/paid, otherwise student's current monthly fee
    const monthBaseFee = existing ? existing.baseAmount : baseMonthlyFee;

    const details = calculateMonthFeeDetails({
      monthName,
      year: currYear,
      baseMonthlyFee: monthBaseFee,
      isPaid,
      isPending: isPending || isAwaiting,
      isWaived,
      dueDay,
      lateFeeAmount
    });

    const finalStatus = isPaid 
      ? "PAID" 
      : isAwaiting 
      ? (existing?.utr ? "AWAITING_CONFIRMATION" : "PAYMENT_CREATED")
      : isPending 
      ? "PAYMENT_PENDING" 
      : details.status;

    timeline.push({
      id: existing?.id || null,
      month: monthName,
      year: currYear,
      baseAmount: isPaid && existing ? existing.baseAmount : details.baseAmount,
      lateFee: isPaid && existing ? existing.lateFee : details.lateFee,
      totalAmount: isPaid && existing ? existing.totalAmount : details.totalAmount,
      status: finalStatus,
      isOverdue: details.isOverdue,
      lateFeeWaived: isWaived,
      waiverReason: existing?.waiverReason || null,
      paymentMethod: existing?.paymentMethod || null,
      paymentReference: (existing as any)?.paymentReference || null,
      utr: (existing as any)?.utr || null,
      paidAt: existing?.paidAt || null,
      createdAt: existing?.createdAt || null
    });

    // Move to next month
    currMonthIdx++;
    if (currMonthIdx > 11) {
      currMonthIdx = 0;
      currYear++;
    }
  }

  return timeline;
}
