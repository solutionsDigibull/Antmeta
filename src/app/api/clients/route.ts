import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { clientFilterSchema, createClientSchema } from '@/lib/validations'
import { dbClientToClient } from '@/lib/supabase/converters'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  if (!isAdminRole(role)) return forbidden()

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = clientFilterSchema.safeParse(params)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { page, limit, status, kyc, plan, search } = parsed.data
  const offset = (page - 1) * limit

  let query = supabase
    .from('clients')
    .select('*, user:users(*), plan:plans(*), partner:partners(*)', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (kyc) query = query.eq('kyc_status', kyc)
  if (plan) query = query.eq('plan_id', plan)
  if (search) {
    query = query.or(`client_id.ilike.%${search}%`)
  }

  const { data, error: dbError, count } = await query
    .order('joined_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const clients = (data || []).map((row: Record<string, unknown>) =>
    dbClientToClient(
      row as never,
      row.user as never,
      row.plan as never,
      row.partner as never
    )
  )

  return NextResponse.json({ data: clients, total: count || 0, page, limit })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  if (!isAdminRole(role)) return forbidden()

  const body = await request.json()
  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { name, email, phone, account_type, pan, plan_id, partner_id } = parsed.data

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    phone,
    email_confirm: true,
    user_metadata: { name, account_type, role: 'client' },
    app_metadata: { role: 'client' },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: clientIdData } = await supabase.rpc('generate_client_id')
  const clientId = clientIdData || `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}100001`

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .insert({
      user_id: authData.user.id,
      client_id: clientId,
      pan,
      plan_id,
      partner_id,
    })
    .select('*, user:users(*), plan:plans(*), partner:partners(*)')
    .single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  const client = dbClientToClient(
    clientData,
    clientData.user,
    clientData.plan,
    clientData.partner
  )

  return NextResponse.json({ data: client }, { status: 201 })
}
