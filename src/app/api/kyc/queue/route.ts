import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, forbidden } from '@/lib/api-helpers'
import { dbKycToKycItem } from '@/lib/supabase/converters'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminOrSupport(getUserRole(user!))) return forbidden()

  // Get clients with pending KYC
  const { data: clients, error: dbError } = await supabase
    .from('clients')
    .select('*, user:users(*)')
    .eq('kyc_status', 'pending')
    .order('joined_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const items = []
  for (const client of clients || []) {
    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('client_id', client.id)
      .order('uploaded_at')

    items.push(
      dbKycToKycItem(client, client.user?.name || '', client.user?.account_type || 'individual', docs || [])
    )
  }

  return NextResponse.json({ data: items })
}
