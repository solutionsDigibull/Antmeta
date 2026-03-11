import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)

  let query = supabase
    .from('billing_cycles')
    .select('*, client:clients(*, user:users(name), plan:plans(name))')

  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (clientRecord) {
      query = query.eq('client_id', clientRecord.id)
    }
  }

  const statusFilter = request.nextUrl.searchParams.get('status')
  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error: dbError } = await query.order('cycle_start', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}
