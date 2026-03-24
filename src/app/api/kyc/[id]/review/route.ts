import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { reviewKycSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminOrSupport(getUserRole(user!))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const parsed = reviewKycSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { data, error: dbError } = await supabase
    .from('kyc_documents')
    .update({
      status: parsed.data.status,
      reviewer_id: user!.id,
      reviewer_note: parsed.data.reviewer_note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Check if all docs for this client are verified -> update client kyc_status
  if (parsed.data.status === 'verified') {
    const { data: allDocs } = await supabase
      .from('kyc_documents')
      .select('status')
      .eq('client_id', data.client_id)

    const allVerified = allDocs?.every((d: { status: string }) => d.status === 'verified')
    if (allVerified) {
      await supabase
        .from('clients')
        .update({ kyc_status: 'verified' })
        .eq('id', data.client_id)
    }
  } else if (parsed.data.status === 'rejected') {
    await supabase
      .from('clients')
      .update({ kyc_status: 'rejected' })
      .eq('id', data.client_id)
  }

  return NextResponse.json({ data })
}
