import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { badRequest } from '@/lib/api-helpers'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, otp } = body

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return badRequest('Valid email is required')
  }
  if (!otp || typeof otp !== 'string') {
    return badRequest('OTP is required')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceRoleClient() as any

  const { data: token, error: fetchError } = await supabase
    .from('otp_tokens')
    .select('id, otp_hash, expires_at, used, failed_attempts')
    .eq('email', email)
    .eq('type', 'login')
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError || !token) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
  }

  if ((token.failed_attempts ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please request a new OTP.' },
      { status: 400 }
    )
  }

  // Timing-safe comparison to prevent timing attacks
  const inputHash = Buffer.from(createHash('sha256').update(String(otp)).digest('hex'))
  const storedHash = Buffer.from(token.otp_hash)

  const match = inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)

  if (!match) {
    await supabase
      .from('otp_tokens')
      .update({ failed_attempts: (token.failed_attempts ?? 0) + 1 })
      .eq('id', token.id)
    return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 })
  }

  // Mark token as used before proceeding (prevents replay attacks)
  await supabase.from('otp_tokens').update({ used: true }).eq('id', token.id)

  // Look up user in public.users
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('email', email)
    .maybeSingle()

  if (userError || !userRow) {
    return NextResponse.json(
      { error: 'No account found with this email. Please sign up first.' },
      { status: 404 }
    )
  }

  if (userRow.status === 'inactive' || userRow.status === 'suspended') {
    return NextResponse.json(
      { error: 'Your account has been suspended. Please contact support.' },
      { status: 403 }
    )
  }

  // Generate a magic link to bootstrap a Supabase session.
  // admin.createSession is not available in this SDK version — we use generateLink instead.
  // IMPORTANT: Do not log the response — it contains a one-time session token.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Failed to create session. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    hashed_token: linkData.properties.hashed_token,
    role: userRow.role,
  })
}
