import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { createPlanSchema } from '@/lib/validations'

export async function GET() {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { data, error: dbError } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  if (!isAdminRole(role)) return forbidden()

  const body = await request.json()
  const parsed = createPlanSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('plans')
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
