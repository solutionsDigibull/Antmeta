import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { dbPartnerToPartner } from '@/lib/supabase/converters'
import { createPartnerSchema } from '@/lib/validations'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { data, error: dbError } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const partners = (data || []).map(dbPartnerToPartner)

  return NextResponse.json({ data: partners })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const body = await request.json()
  const parsed = createPartnerSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  // Verify the target user exists before creating a partner record
  let targetUserId = user!.id
  if (parsed.data.user_id) {
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', parsed.data.user_id)
      .maybeSingle()
    if (!targetUser) return badRequest('Specified user does not exist')
    targetUserId = parsed.data.user_id
  }

  const { data, error: dbError } = await supabase
    .from('partners')
    .insert({
      name: parsed.data.name,
      user_id: targetUserId,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: dbPartnerToPartner(data) }, { status: 201 })
}
