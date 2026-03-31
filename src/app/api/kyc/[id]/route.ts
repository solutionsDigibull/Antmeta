import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { uploadKycDocSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)

  // Clients may only access their own KYC documents
  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .eq('id', id)
      .maybeSingle()

    if (!clientRecord) return forbidden()
  }

  const { data, error: dbError } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('client_id', id)
    .order('uploaded_at')

  if (dbError) return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { id } = await params
  const role = getUserRole(user!)

  // Clients may only upload documents to their own profile
  if (!isAdminRole(role)) {
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .eq('id', id)
      .maybeSingle()

    if (!clientRecord) return forbidden()
  }

  const body = await request.json()
  const parsed = uploadKycDocSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0].message)

  const { data, error: dbError } = await supabase
    .from('kyc_documents')
    .insert({
      client_id: id,
      document_type: parsed.data.document_type,
      file_url: parsed.data.file_url,
      file_name: parsed.data.file_name,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
