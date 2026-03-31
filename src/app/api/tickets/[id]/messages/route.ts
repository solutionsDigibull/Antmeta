import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { createTicketMessageSchema } from '@/lib/validations'

async function getClientTicketOwnership(
  supabase: Awaited<ReturnType<typeof getAuthenticatedUser>>['supabase'],
  userId: string,
  ticketId: string
) {
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!clientRecord) return false

  const { data: ticket } = await supabase
    .from('tickets')
    .select('client_id')
    .eq('id', ticketId)
    .maybeSingle()

  return ticket?.client_id === clientRecord.id
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)

  if (!isAdminOrSupport(role)) {
    const owns = await getClientTicketOwnership(supabase, user!.id, id)
    if (!owns) return forbidden()
  }

  const { data, error: dbError } = await supabase
    .from('ticket_messages')
    .select('*, sender:users(name, role)')
    .eq('ticket_id', id)
    .order('created_at')

  if (dbError) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)
  const isStaff = isAdminOrSupport(role)

  if (!isStaff) {
    const owns = await getClientTicketOwnership(supabase, user!.id, id)
    if (!owns) return forbidden()
  }

  const body = await request.json()
  const parsed = createTicketMessageSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: id,
      sender_id: user!.id,
      message: parsed.data.message,
      // Clients cannot post internal notes
      is_internal: isStaff ? parsed.data.is_internal : false,
    })
    .select('*, sender:users(name, role)')
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
