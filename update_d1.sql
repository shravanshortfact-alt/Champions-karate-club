CREATE TABLE IF NOT EXISTS "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "upiId" TEXT,
    "upiDisplayName" TEXT,
    "paymentEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PaymentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "studentId" TEXT NOT NULL,
    "branchId" TEXT,
    "teacherId" TEXT,
    "paymentReference" TEXT UNIQUE,
    "teacherUpiIdSnapshot" TEXT,
    "teacherUpiNameSnapshot" TEXT,
    "utr" TEXT,
    "cashfreeOrderId" TEXT UNIQUE,
    "cashfreePaymentId" TEXT,
    "paymentSessionId" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_CONFIRMATION',
    "paymentMethod" TEXT NOT NULL DEFAULT 'DIRECT_UPI',
    "manualPaymentNote" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Branch" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "branchId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "teacherUpiIdSnapshot" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "teacherUpiNameSnapshot" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "utr" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "cashfreeOrderId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "cashfreePaymentId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "paymentMethod" TEXT DEFAULT 'DIRECT_UPI';
ALTER TABLE "FeePayment" ADD COLUMN "paymentOrderId" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "lateFeeWaived" BOOLEAN DEFAULT 0;
ALTER TABLE "FeePayment" ADD COLUMN "waiverReason" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "waivedBy" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "waivedAt" DATETIME;
ALTER TABLE "FeePayment" ADD COLUMN "confirmedBy" TEXT;
ALTER TABLE "FeePayment" ADD COLUMN "confirmedAt" DATETIME;
ALTER TABLE "FeePayment" ADD COLUMN "paidAt" DATETIME;
