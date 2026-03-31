import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { updateUserRoleSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const currentRole = getUserRole(user!)
  if (currentRole !== 'super_admin') return forbidden()

  const { id } = await params

  // Prevent super_admin from modifying their own role
  if (id === user!.id) return badRequest('Cannot modify your own role')

  const body = await request.json()
  const parsed = updateUserRoleSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  // Prevent assigning super_admin via this endpoint (must be done via DB/manual process)
  if (parsed.data.role === 'super_admin') {
    return badRequest('Cannot assign super_admin role through this endpoint')
  }

  // Update in users table
  const { data, error: dbError } = await supabase
    .from('users')
    .update({ role: parsed.data.role })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  if (!data) return notFound('User not found')

  // Also update app_metadata in auth
  await supabase.auth.admin.updateUserById(id, {
    app_metadata: { role: parsed.data.role },
  })

  return NextResponse.json({ data })
}
