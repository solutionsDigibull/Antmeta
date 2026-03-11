import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { data, error: dbError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const unreadCount = (data || []).filter((n: { read_at: string | null }) => !n.read_at).length

  return NextResponse.json({ data: data || [], unread_count: unreadCount })
}
