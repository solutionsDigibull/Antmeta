import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'

export async function GET() {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { data: masters, error: dbError } = await supabase
    .from('master_accounts')
    .select('*')
    .order('id')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Enrich with recent trade stats
  const performance = await Promise.all(
    (masters || []).map(async (master: Record<string, unknown>) => {
      const { count: todayTrades } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('master_id', master.id)
        .gte('executed_at', new Date().toISOString().split('T')[0])

      return {
        ...master,
        trades_today: todayTrades || 0,
      }
    })
  )

  return NextResponse.json({ data: performance })
}
