import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest } from '@/lib/api-helpers'
import { exchangeConnectionSchema } from '@/lib/validations'

async function getClientRecord(supabase: Awaited<ReturnType<typeof getAuthenticatedUser>>['supabase'], userId: string) {
  const { data } = await supabase!
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const client = await getClientRecord(supabase, user!.id)
  if (!client) return NextResponse.json({ data: { status: 'not-connected', last_verified: null } })

  const { data: conn } = await supabase!
    .from('exchange_connections')
    .select('last_verified, is_active')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!conn) return NextResponse.json({ data: { status: 'not-connected', last_verified: null } })

  const status = conn.last_verified ? 'connected' : 'api-added'
  return NextResponse.json({ data: { status, last_verified: conn.last_verified } })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const parsed = exchangeConnectionSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const client = await getClientRecord(supabase, user!.id)
  if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 })

  const apiKeyHash = createHash('sha256').update(parsed.data.api_key).digest('hex')
  const secretKeyHash = createHash('sha256').update(parsed.data.secret_key).digest('hex')

  // Check if a row already exists for this client
  const { data: existing } = await supabase!
    .from('exchange_connections')
    .select('id')
    .eq('client_id', client.id)
    .maybeSingle()

  let dbError: { message: string } | null = null

  if (existing) {
    const { error: updateError } = await supabase!
      .from('exchange_connections')
      .update({
        api_key_hash: apiKeyHash,
        api_secret_hash: secretKeyHash,
        is_active: true,
        last_verified: null,
      })
      .eq('id', existing.id)
    dbError = updateError
  } else {
    const { error: insertError } = await supabase!
      .from('exchange_connections')
      .insert({
        client_id: client.id,
        exchange: 'delta_exchange',
        api_key_hash: apiKeyHash,
        api_secret_hash: secretKeyHash,
        is_active: true,
      })
    dbError = insertError
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const client = await getClientRecord(supabase, user!.id)
  if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 })

  const { error: dbError } = await supabase!
    .from('exchange_connections')
    .update({ is_active: false })
    .eq('client_id', client.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
