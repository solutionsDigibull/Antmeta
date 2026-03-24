import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden } from '@/lib/api-helpers'
import { formatRelativeTime } from '@/lib/supabase/converters'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { data, error: dbError } = await supabase!
    .from('exchange_connections')
    .select('id, last_verified, is_active, client:clients(id, client_id, user:users(name))')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const connections = (data || []).map((row: Record<string, unknown>) => {
    const client = row.client as Record<string, unknown> | null
    const user = client?.user as Record<string, unknown> | null
    const lastVerified = row.last_verified as string | null
    const isActive = row.is_active as boolean

    let status: 'connected' | 'api-added' | 'disconnected'
    if (!isActive) status = 'disconnected'
    else if (lastVerified) status = 'connected'
    else status = 'api-added'

    return {
      id: row.id as string,
      client_name: (user?.name as string) || 'Unknown',
      client_display_id: (client?.client_id as string) || '—',
      status,
      last_verified: lastVerified,
      last_checked: lastVerified ? formatRelativeTime(lastVerified) : 'Never',
    }
  })

  return NextResponse.json({ data: connections })
}
