import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest, notFound } from '@/lib/api-helpers'
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

  // Idempotency: fetch invoice and check if already paid
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, razorpay_payment_id')
    .eq('razorpay_order_id', razorpay_order_id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!invoice) return notFound('Invoice not found')

  // Already processed — return success without double-writing
  if (invoice.razorpay_payment_id) {
    return NextResponse.json({ verified: true })
  }

  const { error: dbError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'razorpay',
      razorpay_payment_id,
    })
    .eq('id', invoice.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ verified: true })
}
