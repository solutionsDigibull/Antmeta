import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, notFound } from '@/lib/api-helpers'

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
    .select('*, client:clients(*, user:users(email, phone))')
    .eq('id', id)
    .single()

  if (dbError || !invoice) return notFound('Invoice not found')

  // TODO: Create Razorpay payment link and send to client
  // This will be implemented in Step 17 (Razorpay integration)

  return NextResponse.json({
    data: { message: 'Payment link creation pending Razorpay integration', invoice_id: id },
  })
}
