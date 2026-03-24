import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, badRequest } from '@/lib/api-helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, email, phone, accountType } = body

  if (!name || name.length < 2) return badRequest('Name is required')

  const supabase = await createServiceRoleClient()

  // Upsert public.users record
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: email || user.email || '',
      phone: phone || null,
      name,
      role: 'client',
      account_type: accountType || 'individual',
      status: 'active',
    }, { onConflict: 'id' })

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  // Check if client record already exists (idempotent)
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const clientId = `C${Date.now().toString().slice(-8)}`
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        client_id: clientId,
        kyc_status: 'pending',
        status: 'pending',
      })

    if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
