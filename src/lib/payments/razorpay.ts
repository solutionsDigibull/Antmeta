import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!
const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1'

function authHeader() {
  const encoded = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
  return { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' }
}

export async function createOrder(amountInPaise: number, currency = 'INR', notes?: Record<string, string>) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      notes: notes || {},
    }),
  })
  if (!res.ok) throw new Error(`Razorpay order error: ${res.status}`)
  return res.json()
}

export async function createPaymentLink(
  amountInPaise: number,
  description: string,
  customer: { name: string; email?: string; contact?: string },
  notes?: Record<string, string>
) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payment_links`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      description,
      customer,
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: notes || {},
    }),
  })
  if (!res.ok) throw new Error(`Razorpay payment link error: ${res.status}`)
  return res.json()
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  )
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}
