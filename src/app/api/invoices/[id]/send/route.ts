import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, notFound } from '@/lib/api-helpers'
import { createPaymentLink } from '@/lib/payments/razorpay'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { id } = await params
  const { data: invoice, error: dbError } = await supabase
    .from('invoices')
    .select('*, client:clients(*, user:users(email, phone, name))')
    .eq('id', id)
    .single()

  if (dbError || !invoice) return notFound('Invoice not found')

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
  }

  try {
    const amountInPaise = Math.round(invoice.total_amount * 100)
    const clientUser = invoice.client?.user
    const paymentLink = await createPaymentLink(
      amountInPaise,
      `Invoice ${invoice.invoice_number}`,
      {
        name: clientUser?.name || 'Client',
        email: clientUser?.email || undefined,
        contact: clientUser?.phone || undefined,
      },
      { invoice_id: id, invoice_number: invoice.invoice_number }
    )

    // Update invoice with payment link
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_link: paymentLink.short_url,
        razorpay_payment_link_id: paymentLink.id,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update invoice with payment link' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        payment_link: paymentLink.short_url,
        invoice_id: id,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payment link'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
