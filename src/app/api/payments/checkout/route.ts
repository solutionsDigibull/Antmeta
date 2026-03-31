import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, badRequest, notFound } from '@/lib/api-helpers'
import { createOrder } from '@/lib/payments/razorpay'

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
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

  // Clients may only initiate checkout for their own invoices
  const role = getUserRole(user!)
  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (!clientRecord || invoice.client_id !== clientRecord.id) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
  }

  // Amount in paise
  const amountInPaise = Math.round(invoice.total_amount * 100)

  try {
    const order = await createOrder(amountInPaise, 'INR', {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
    })

    // Store razorpay_order_id on invoice
    const { error: updateErr } = await supabase
      .from('invoices')
      .update({ razorpay_order_id: order.id })
      .eq('id', invoice_id)

    if (updateErr) throw new Error('order_store_failed')

    return NextResponse.json({
      data: {
        order_id: order.id,
        amount: amountInPaise,
        currency: 'INR',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
