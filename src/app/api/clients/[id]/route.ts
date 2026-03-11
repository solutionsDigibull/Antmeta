import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { updateClientSchema } from '@/lib/validations'
import { dbClientToClient } from '@/lib/supabase/converters'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params

  const { data, error: dbError } = await supabase
    .from('clients')
    .select('*, user:users(*), plan:plans(*), partner:partners(*)')
    .eq('id', id)
    .single()

  if (dbError || !data) return notFound('Client not found')

  return NextResponse.json({ data: dbClientToClient(data, data.user, data.plan, data.partner) })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  if (!isAdminRole(role)) return forbidden()

  const { id } = await params
  const body = await request.json()
  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('clients')
    .update(parsed.data)
    .eq('id', id)
    .select('*, user:users(*), plan:plans(*), partner:partners(*)')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!data) return notFound('Client not found')

  return NextResponse.json({ data: dbClientToClient(data, data.user, data.plan, data.partner) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  if (!isAdminRole(role)) return forbidden()

  const { id } = await params

  const { error: dbError } = await supabase
    .from('clients')
    .update({ status: 'inactive' })
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
