import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  const masterId = request.nextUrl.searchParams.get('master_id')
  const clientId = request.nextUrl.searchParams.get('client_id')
  const days = Number(request.nextUrl.searchParams.get('days') || '30')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = supabase
    .from('pnl_snapshots')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])

  if (masterId) query = query.eq('master_id', masterId)

  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (clientRecord) query = query.eq('client_id', clientRecord.id)
  } else if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error: dbError } = await query.order('date')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}
