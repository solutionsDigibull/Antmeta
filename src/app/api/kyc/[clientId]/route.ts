import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { clientId } = await params

  const { data, error: dbError } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { clientId } = await params
  const body = await request.json()

  const { data, error: dbError } = await supabase
    .from('kyc_documents')
    .insert({
      client_id: clientId,
      document_type: body.document_type,
      file_url: body.file_url,
      file_name: body.file_name,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
