import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { badRequest } from '@/lib/api-helpers'

const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, otp, name, mobile, accountType, password } = body

  if (!email || !otp) return badRequest('Email and OTP are required')
  if (!password || password.length < 8) return badRequest('Password must be at least 8 characters')
  if (!name || name.length < 2) return badRequest('Name is required')

  const supabase = await createServiceRoleClient()

  const { data: token, error: fetchError } = await supabase
    .from('otp_tokens')
    .select('id, otp_hash, expires_at, used, failed_attempts')
    .eq('email', email)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError || !token) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: 'OTP has expired' }, { status: 400 })
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

  const match = inputHash.length === storedHash.length &&
    timingSafeEqual(inputHash, storedHash)

  if (!match) {
    await supabase
      .from('otp_tokens')
      .update({ failed_attempts: (token.failed_attempts ?? 0) + 1 })
      .eq('id', token.id)

    return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 })
  }

  // Mark token as used before creating the user (prevents replay)
  await supabase.from('otp_tokens').update({ used: true }).eq('id', token.id)

  // Create Supabase auth user
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      account_type: accountType || 'individual',
    },
    app_metadata: {
      role: 'client',
    },
  })

  if (createError) {
    // User already registered — do not allow password reset via signup flow
    if (
      createError.message.toLowerCase().includes('already registered') ||
      createError.message.toLowerCase().includes('already exists')
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }
    // Don't expose internal Supabase error details to the client
    return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 500 })
  }

  // Set phone if provided
  if (mobile && authData.user) {
    const phone = `+91${mobile.replace(/\D/g, '')}`
    await supabase.auth.admin.updateUserById(authData.user.id, { phone })
  }

  return NextResponse.json({ success: true })
}
