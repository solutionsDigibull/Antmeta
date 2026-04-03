import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest } from '@/lib/api-helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const { name, phone } = body

  if (!name || name.trim().length < 2) return badRequest('Name must be at least 2 characters')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceRoleClient() as any
  const { error: updateError } = await supabase
    .from('users')
    .update({
      name: name.trim(),
      phone: phone || null,
    })
    .eq('id', user!.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
