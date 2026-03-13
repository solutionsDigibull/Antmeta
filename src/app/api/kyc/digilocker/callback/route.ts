import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const codeVerifier = request.cookies.get('digilocker_cv')?.value
  const storedState = request.cookies.get('digilocker_state')?.value

  if (!code || !state) {
    return NextResponse.redirect(new URL('/client/profile?kyc=error', request.url))
  }

  // CSRF protection: verify state matches what was set at authorize time
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/client/profile?kyc=error&reason=invalid_state', request.url))
  }

  const clientId = process.env.DIGILOCKER_CLIENT_ID
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/client/profile?kyc=error', request.url))
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/client/profile?kyc=error&reason=missing_verifier', request.url))
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/client/profile?kyc=error', request.url))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Fetch eAadhaar XML
    const aadhaarRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/3/xml/eaadhaar', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!aadhaarRes.ok) {
      return NextResponse.redirect(new URL('/client/profile?kyc=error', request.url))
    }

    const aadhaarData = await aadhaarRes.json()
    const docId = aadhaarData.uri || `in.gov.uidai-ADHAR-${Date.now()}`

    // Get client record for current user
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (!clientRecord) {
      return NextResponse.redirect(new URL('/client/profile?kyc=error&reason=no_client', request.url))
    }

    // Upsert KYC document as verified
    const { error: upsertError } = await supabase
      .from('kyc_documents')
      .upsert({
        client_id: clientRecord.id,
        document_type: 'aadhaar',
        status: 'verified',
        digilocker_doc_id: docId,
        digilocker_verified: true,
        uploaded_at: new Date().toISOString(),
      }, { onConflict: 'client_id,document_type' })

    if (upsertError) {
      return NextResponse.redirect(new URL('/client/profile?kyc=error&reason=db_error', request.url))
    }

    const response = NextResponse.redirect(new URL('/client/profile?kyc=success', request.url))
    response.cookies.delete('digilocker_cv')
    response.cookies.delete('digilocker_state')
    return response
  } catch {
    return NextResponse.redirect(new URL('/client/profile?kyc=error', request.url))
  }
}
