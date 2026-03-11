import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest } from '@/lib/api-helpers'
import { verifyPaymentSignature } from '@/lib/payments/razorpay'

export async function POST(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return badRequest('Missing payment verification fields')
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'razorpay',
      razorpay_payment_id,
    })
    .eq('razorpay_order_id', razorpay_order_id)

  return NextResponse.json({ verified: true })
}
