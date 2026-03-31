import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { updateInvoiceSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)

  const { data, error: dbError } = await supabase
    .from('invoices')
    .select('*, client:clients(*, user:users(name))')
    .eq('id', id)
    .single()

  if (dbError || !data) return notFound('Invoice not found')

  // Clients may only access their own invoices
  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (!clientRecord || data.client_id !== clientRecord.id) return forbidden()
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const parsed = updateInvoiceSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { data, error: dbError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  if (!data) return notFound('Invoice not found')

  return NextResponse.json({ data })
}
