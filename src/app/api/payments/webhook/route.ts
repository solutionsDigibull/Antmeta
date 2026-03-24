import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const supabase: AnySupabaseClient = await createServiceRoleClient()

  switch (event.event) {
    case 'order.paid': {
      const orderId = event.payload.order?.entity?.id
      if (orderId) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, client_id')
          .eq('razorpay_order_id', orderId)
          .single()

        if (invoice) {
          const paymentId = event.payload.payment?.entity?.id

          // Check idempotency — skip if already paid
          const { data: existingTxn } = await supabase
            .from('transactions')
            .select('id')
            .eq('gateway_ref', paymentId)
            .maybeSingle()

          if (!existingTxn) {
            const { error: updateErr } = await supabase.from('invoices').update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: 'razorpay',
              razorpay_payment_id: paymentId,
            }).eq('id', invoice.id)

            if (updateErr) {
              console.error('Webhook invoice update failed:', updateErr.message)
              return NextResponse.json({ error: 'DB error' }, { status: 500 })
            }

            const { error: txnErr } = await supabase.from('transactions').insert({
              invoice_id: invoice.id,
              client_id: invoice.client_id,
              amount: event.payload.payment?.entity?.amount / 100,
              type: 'payment',
              gateway: 'razorpay',
              gateway_ref: paymentId,
              status: 'success',
            })

            if (txnErr) {
              console.error('Webhook transaction insert failed:', txnErr.message)
              return NextResponse.json({ error: 'DB error' }, { status: 500 })
            }
          }
        }
      }
      break
    }

    case 'payment_link.paid': {
      const linkId = event.payload.payment_link?.entity?.id
      if (linkId) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, client_id')
          .eq('razorpay_order_id', linkId)
          .single()

        if (invoice) {
          const paymentId = event.payload.payment?.entity?.id

          const { data: existingTxn } = await supabase
            .from('transactions')
            .select('id')
            .eq('gateway_ref', paymentId)
            .maybeSingle()

          if (!existingTxn) {
            const { error: updateErr } = await supabase.from('invoices').update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: 'razorpay',
              razorpay_payment_id: paymentId,
            }).eq('id', invoice.id)

            if (updateErr) {
              console.error('Webhook link invoice update failed:', updateErr.message)
              return NextResponse.json({ error: 'DB error' }, { status: 500 })
            }

            const { error: txnErr } = await supabase.from('transactions').insert({
              invoice_id: invoice.id,
              client_id: invoice.client_id,
              amount: event.payload.payment?.entity?.amount / 100,
              type: 'payment',
              gateway: 'razorpay',
              gateway_ref: paymentId,
              status: 'success',
            })

            if (txnErr) {
              console.error('Webhook link transaction insert failed:', txnErr.message)
              return NextResponse.json({ error: 'DB error' }, { status: 500 })
            }
          }
        }
      }
      break
    }

    case 'refund.processed': {
      const refundId = event.payload.refund?.entity?.id
      const paymentId = event.payload.refund?.entity?.payment_id
      if (refundId && paymentId) {
        // Idempotency: skip if refund already recorded
        const { data: existingRefund } = await supabase
          .from('transactions')
          .select('id')
          .eq('gateway_ref', refundId)
          .maybeSingle()

        if (!existingRefund) {
          const { error: txnErr } = await supabase.from('transactions').insert({
            client_id: event.payload.refund?.entity?.notes?.client_id || null,
            amount: event.payload.refund?.entity?.amount / 100,
            type: 'refund',
            gateway: 'razorpay',
            gateway_ref: refundId,
            status: 'success',
          })

          if (txnErr) {
            console.error('Webhook refund insert failed:', txnErr.message)
            return NextResponse.json({ error: 'DB error' }, { status: 500 })
          }
        }
      }
      break
    }
  }

  return NextResponse.json({ status: 'ok' })
}
