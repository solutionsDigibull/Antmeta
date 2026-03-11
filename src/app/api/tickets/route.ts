import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, badRequest } from '@/lib/api-helpers'
import { paginationSchema, createTicketSchema } from '@/lib/validations'
import { dbTicketToTicket } from '@/lib/supabase/converters'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paginationSchema.safeParse(params)
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 }
  const offset = (page - 1) * limit

  let query = supabase
    .from('tickets')
    .select('*, client:clients(client_id, user:users(name))', { count: 'exact' })

  if (!isAdminOrSupport(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (clientRecord) query = query.eq('client_id', clientRecord.id)
  }

  const statusFilter = request.nextUrl.searchParams.get('status')
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error: dbError, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const tickets = (data || []).map((row: Record<string, unknown>) => {
    const client = row.client as Record<string, unknown> | null
    const clientUser = client?.user as Record<string, unknown> | null
    return dbTicketToTicket(row as never, (clientUser?.name as string) || 'Unknown')
  })

  return NextResponse.json({ data: tickets, total: count || 0, page, limit })
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const parsed = createTicketSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  // Generate ticket number
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
  const ticketNumber = `TKT-${String((count || 0) + 1).padStart(3, '0')}`

  const { data, error: dbError } = await supabase
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      client_id: parsed.data.client_id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
