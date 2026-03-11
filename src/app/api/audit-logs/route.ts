import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden } from '@/lib/api-helpers'
import { paginationSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paginationSchema.safeParse(params)
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 50 }
  const offset = (page - 1) * limit

  const { data, error: dbError, count } = await supabase
    .from('audit_logs')
    .select('*, user:users(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [], total: count || 0, page, limit })
}
