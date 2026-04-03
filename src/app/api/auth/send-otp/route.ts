import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomInt } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { badRequest } from '@/lib/api-helpers'
import { sendOtpEmail } from '@/lib/email'

// Basic RFC 5322-compliant email format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const OTP_RATE_LIMIT = 3       // max sends per window
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000  // 10 minutes

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return badRequest('Valid email is required')
  }

  const supabase = await createServiceRoleClient()

  // Rate limit: max 3 OTP requests per email per 10 minutes
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('otp_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= OTP_RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait before requesting another.' },
      { status: 429 }
    )
  }

  const otp = randomInt(100000, 999999).toString()
  const otpHash = createHash('sha256').update(otp).digest('hex')

  // Invalidate any prior unused tokens for this email
  await supabase.from('otp_tokens').delete().eq('email', email).eq('used', false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('otp_tokens').insert({
    email,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false,
    failed_attempts: 0,
  })

  if (error) return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })

  await sendOtpEmail(email, otp)

  return NextResponse.json({ success: true })
}
