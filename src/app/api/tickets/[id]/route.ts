import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { updateTicketSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)

  const { data, error: dbError } = await supabase
    .from('tickets')
    .select('*, client:clients(client_id, user:users(name)), messages:ticket_messages(*, sender:users(name, role))')
    .eq('id', id)
    .single()

  if (dbError || !data) return notFound('Ticket not found')

  // Clients may only view their own tickets
  if (!isAdminOrSupport(role)) {
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
  if (!isAdminOrSupport(getUserRole(user!))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const parsed = updateTicketSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error: dbError } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  if (!data) return notFound('Ticket not found')

  return NextResponse.json({ data })
}
