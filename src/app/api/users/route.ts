import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden } from '@/lib/api-helpers'
import { dbUserToUser } from '@/lib/supabase/converters'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { data, error: dbError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const users = (data || []).map(dbUserToUser)

  return NextResponse.json({ data: users })
}
