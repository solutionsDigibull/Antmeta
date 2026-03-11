import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest, notFound } from '@/lib/api-helpers'
import { updatePartnerSchema } from '@/lib/validations'
import { dbPartnerToPartner } from '@/lib/supabase/converters'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params

  const { data, error: dbError } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single()

  if (dbError || !data) return notFound('Partner not found')

  return NextResponse.json({ data: dbPartnerToPartner(data) })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const parsed = updatePartnerSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('partners')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!data) return notFound('Partner not found')

  return NextResponse.json({ data: dbPartnerToPartner(data) })
}
