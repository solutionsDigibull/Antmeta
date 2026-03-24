import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { data, error: dbError } = await supabase
    .from('clients')
    .select('*, user:users(*), plan:plans(*)')
    .eq('user_id', user!.id)
    .maybeSingle()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Client record not found' }, { status: 404 })

  return NextResponse.json({ data })
}
