import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized, badRequest } from '@/lib/api-helpers'

const DELTA_API_BASE = 'https://api.delta.exchange'
const TEST_PATH = '/v2/profile'

const DELTA_ERROR_MAP: Record<string, string> = {
  ip_not_whitelisted: 'IP not whitelisted — Add 13.235.112.48 to Delta Exchange → API → IP Restrictions',
  InvalidApiKey: 'Invalid API key — The key does not exist on Delta Exchange. Please regenerate and re-enter.',
  invalid_api_key: 'Invalid API key — The key does not exist on Delta Exchange. Please regenerate and re-enter.',
  SignatureExpired: 'Signature expired — Server clock may be out of sync. Please try again.',
  signature_expired: 'Signature expired — Server clock may be out of sync. Please try again.',
  SignatureMismatch: 'Signature mismatch — Check that your Secret Key is correct.',
  signature_mismatch: 'Signature mismatch — Check that your Secret Key is correct.',
  unauthorized: 'Unauthorized — API key may have insufficient permissions. Enable Read + Trade.',
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const body = await request.json()
  const { api_key, secret_key } = body

  if (!api_key || typeof api_key !== 'string' || api_key.length < 10)
    return badRequest('api_key is required')
  if (!secret_key || typeof secret_key !== 'string' || secret_key.length < 10)
    return badRequest('secret_key is required')

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const prehash = 'GET' + timestamp + TEST_PATH
  const signature = createHmac('sha256', secret_key).update(prehash).digest('hex')

  let deltaResponse: Response
  try {
    deltaResponse = await fetch(`${DELTA_API_BASE}${TEST_PATH}`, {
      method: 'GET',
      headers: {
        'api-key': api_key,
        'signature': signature,
        'timestamp': timestamp,
        'Content-Type': 'application/json',
        'User-Agent': 'AntMeta/1.0',
      },
    })
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Could not reach Delta Exchange. Check your internet connection.',
    })
  }

  if (deltaResponse.ok) {
    // Update last_verified if a connection row exists for this client
    const { data: clientRecord } = await supabase!
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (clientRecord) {
      await supabase!
        .from('exchange_connections')
        .update({ last_verified: new Date().toISOString() })
        .eq('client_id', clientRecord.id)
        .eq('is_active', true)
    }

    return NextResponse.json({ success: true })
  }

  // Parse Delta error response
  let errorMessage = 'Connection test failed. Please check your API key and secret.'
  try {
    const deltaBody = await deltaResponse.json()
    const code: string =
      deltaBody?.error?.code ||
      deltaBody?.code ||
      deltaBody?.error ||
      ''
    errorMessage = DELTA_ERROR_MAP[code] || `Delta Exchange error: ${code || deltaResponse.status}`
  } catch {
    // ignore parse error, use default message
  }

  return NextResponse.json({ success: false, error: errorMessage })
}
