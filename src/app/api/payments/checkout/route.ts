import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest, notFound } from '@/lib/api-helpers'
import { createOrder } from '@/lib/payments/razorpay'

export async function POST(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const { invoice_id } = body
  if (!invoice_id) return badRequest('invoice_id required')

  const { data: invoice, error: dbError } = await supabase
    .from('invoices')
    .select('*, client:clients(*, user:users(name, email, phone))')
    .eq('id', invoice_id)
    .single()

  if (dbError || !invoice) return notFound('Invoice not found')

  // Amount in paise
  const amountInPaise = Math.round(invoice.total_amount * 100)

  try {
    const order = await createOrder(amountInPaise, 'INR', {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
    })

    // Store razorpay_order_id on invoice
    await supabase
      .from('invoices')
      .update({ razorpay_order_id: order.id })
      .eq('id', invoice_id)

    return NextResponse.json({
      data: {
        order_id: order.id,
        amount: amountInPaise,
        currency: 'INR',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
