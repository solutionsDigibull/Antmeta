import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { createNotificationTemplateSchema } from '@/lib/validations'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { data, error: dbError } = await supabase
    .from('notification_templates')
    .select('*')
    .order('created_at')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const body = await request.json()
  const parsed = createNotificationTemplateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('notification_templates')
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
