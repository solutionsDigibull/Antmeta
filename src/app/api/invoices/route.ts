import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden, badRequest } from '@/lib/api-helpers'
import { paginationSchema, createInvoiceSchema } from '@/lib/validations'
import { dbInvoiceToInvoice } from '@/lib/supabase/converters'

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()

  const role = getUserRole(user!)
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paginationSchema.safeParse(params)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { page, limit } = parsed.data
  const offset = (page - 1) * limit
  const statusFilter = request.nextUrl.searchParams.get('status')

  let query = supabase
    .from('invoices')
    .select('*, client:clients(*, user:users(name))', { count: 'exact' })

  if (!isAdminRole(role)) {
    // Client: only own invoices
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    if (clientRecord) {
      query = query.eq('client_id', clientRecord.id)
    }
  }

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error: dbError, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })

  const invoices = (data || []).map((row: Record<string, unknown>) => {
    const client = row.client as Record<string, unknown> | null
    const clientUser = client?.user as Record<string, unknown> | null
    const clientName = (clientUser?.name as string) || 'Unknown'
    return dbInvoiceToInvoice(row as never, clientName)
  })

  return NextResponse.json({ data: invoices, total: count || 0, page, limit })
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const body = await request.json()
  const parsed = createInvoiceSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.message)

  const { client_id, amount, gst_amount, type, due_date } = parsed.data
  const totalAmount = amount + gst_amount

  // Generate invoice number
  const now = new Date()
  const prefix = `INV-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .ilike('invoice_number', `${prefix}%`)
  const seq = String((count || 0) + 1).padStart(3, '0')

  const { data, error: dbError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: `${prefix}-${seq}`,
      client_id,
      amount,
      gst_amount,
      total_amount: totalAmount,
      type,
      due_date,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
