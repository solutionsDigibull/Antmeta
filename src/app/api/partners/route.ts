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

  const body = await request.json()
  const parsed = createPartnerSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('partners')
    .insert({
      name: parsed.data.name,
      user_id: parsed.data.user_id || user!.id,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: dbPartnerToPartner(data) }, { status: 201 })
}
