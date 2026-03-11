import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized } from '@/lib/api-helpers'
import { paginationSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paginationSchema.safeParse(params)
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 }
  const offset = (page - 1) * limit

  let query = supabase
    .from('transactions')
    .select('*, client:clients(client_id, user:users(name)), invoice:invoices(invoice_number)', { count: 'exact' })

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

  const { data, error: dbError, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [], total: count || 0, page, limit })
}
