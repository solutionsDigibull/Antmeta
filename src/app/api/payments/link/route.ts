import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { createPaymentLink } from '@/lib/payments/razorpay'

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const body = await request.json()
  const { invoice_id } = body
  if (!invoice_id) return badRequest('invoice_id required')

  const { data: invoice, error: dbError } = await supabase
    .from('invoices')
    .select('*, client:clients(*, user:users(name, email, phone))')
    .eq('id', invoice_id)
    .single()

  if (dbError || !invoice) return notFound('Invoice not found')

  const clientUser = invoice.client?.user
  const amountInPaise = Math.round(invoice.total_amount * 100)

  try {
    const link = await createPaymentLink(
      amountInPaise,
      `Invoice ${invoice.invoice_number}`,
      {
        name: clientUser?.name || 'Client',
        email: clientUser?.email,
        contact: clientUser?.phone,
      },
      { invoice_id: invoice.id, invoice_number: invoice.invoice_number }
    )

    // Store razorpay_order_id (payment link ID)
    await supabase
      .from('invoices')
      .update({ razorpay_order_id: link.id, payment_ref: link.short_url })
      .eq('id', invoice_id)

    return NextResponse.json({ data: { link_url: link.short_url, link_id: link.id } })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
