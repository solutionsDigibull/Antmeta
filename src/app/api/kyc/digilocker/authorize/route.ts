import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'
import crypto from 'crypto'

export async function GET() {
  const { error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const clientId = process.env.DIGILOCKER_CLIENT_ID
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'DigiLocker not configured' }, { status: 503 })
  }

  // Generate PKCE challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const state = crypto.randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'files.issueddocs',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    req_doctype: 'ADHAR',
  })

  const authorizeUrl = `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?${params}`

  const response = NextResponse.json({ url: authorizeUrl, state })

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 300,
    path: '/',
  }

  response.cookies.set('digilocker_cv', codeVerifier, cookieOpts)
  response.cookies.set('digilocker_state', state, cookieOpts)

  return response
}
