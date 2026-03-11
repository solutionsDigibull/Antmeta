import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest } from '@/lib/api-helpers'
import { createTicketMessageSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params

  const { data, error: dbError } = await supabase
    .from('ticket_messages')
    .select('*, sender:users(name, role)')
    .eq('ticket_id', id)
    .order('created_at')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const body = await request.json()
  const parsed = createTicketMessageSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: id,
      sender_id: user!.id,
      message: parsed.data.message,
      is_internal: parsed.data.is_internal,
    })
    .select('*, sender:users(name, role)')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
