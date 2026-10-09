import crypto from 'crypto';
import { getSiteSettings } from '@/lib/settings';

export async function getCashfreeConfig() {
  const settings = await getSiteSettings();

  const appId = process.env.CASHFREE_APP_ID || settings.cashfreeAppId || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || settings.cashfreeSecretKey || '';
  const environment = process.env.CASHFREE_ENVIRONMENT || settings.cashfreeEnvironment || 'sandbox';

  const baseUrl = environment === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

  return {
    appId,
    secretKey,
    environment,
    baseUrl
  };
}

export async function createCashfreeOrder({
  orderId,
  amount,
  studentId,
  studentName,
  whatsappNumber,
  note = "Karate Club Monthly Fee"
}: {
  orderId: string;
  amount: number;
  studentId: string;
  studentName: string;
  whatsappNumber?: string | null;
  note?: string;
}) {
  const config = await getCashfreeConfig();

  if (!config.appId || !config.secretKey) {
    // If credentials are not set, return mock order for development/sandbox testing
    console.warn("Cashfree API keys not configured. Falling back to sandbox dev session.");
    return {
      success: true,
      isMock: true,
      orderId,
      paymentSessionId: `session_mock_${orderId}`,
      environment: config.environment
    };
  }

  const sanitizedPhone = (whatsappNumber || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999';

  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: studentId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      customer_name: studentName.slice(0, 50),
      customer_phone: sanitizedPhone.length === 10 ? sanitizedPhone : '9999999999'
    },
    order_meta: {
      payment_methods: 'upi' // Restrict checkout to UPI payments only
    },
    order_note: note
  };

  const res = await fetch(`${config.baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Cashfree order creation error:", data);
    throw new Error(data.message || "Failed to create Cashfree payment order");
  }

  return {
    success: true,
    isMock: false,
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
    environment: config.environment
  };
}

export async function getCashfreeOrderStatus(orderId: string) {
  const config = await getCashfreeConfig();

  if (!config.appId || !config.secretKey) {
    // Mock check fallback for testing environment without keys
    return {
      orderId,
      orderStatus: 'PAID',
      isMock: true,
      paymentId: `pay_mock_${orderId}`
    };
  }

  const res = await fetch(`${config.baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      'x-api-version': '2023-08-01'
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch Cashfree order status");
  }

  return {
    orderId: data.order_id,
    orderStatus: data.order_status, // PAID, ACTIVE, EXPIRED, TERMINATED
    orderAmount: data.order_amount,
    payments: data.payments || [],
    isMock: false
  };
}

export function verifyCashfreeWebhookSignature({
  rawBody,
  timestamp,
  signature,
  secretKey
}: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secretKey: string;
}): boolean {
  if (!signature || !timestamp || !secretKey) return false;

  const dataToSign = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
