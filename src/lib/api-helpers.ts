import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export async function getAuthenticatedUser() {
  const supabase: AnySupabaseClient = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase, error: 'Unauthorized' as const }
  return { user, supabase, error: null }
}

export function isAdminRole(role?: string) {
  return role === 'admin' || role === 'super_admin'
}

export function isAdminOrSupport(role?: string) {
  return role === 'admin' || role === 'super_admin' || role === 'support'
}

export function getUserRole(user: { app_metadata?: Record<string, unknown> }) {
  return (user.app_metadata?.role as string) || 'client'
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}
