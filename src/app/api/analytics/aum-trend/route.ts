import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const days = Number(request.nextUrl.searchParams.get('days') || '30')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error: dbError } = await supabase
    .from('pnl_snapshots')
    .select('date, aum')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Aggregate AUM by date
  const byDate: Record<string, number> = {}
  for (const row of data || []) {
    byDate[row.date] = (byDate[row.date] || 0) + Number(row.aum)
  }

  const trend = Object.entries(byDate).map(([date, aum]) => ({ date, aum }))

  return NextResponse.json({ data: trend })
}
