import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorized } from '@/lib/api-helpers'
import { dbMasterToMaster } from '@/lib/supabase/converters'

export async function GET() {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const { data, error: dbError } = await supabase
    .from('master_accounts')
    .select('*')
    .order('id')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const masters = (data || []).map(dbMasterToMaster)

  return NextResponse.json({ data: masters })
}
