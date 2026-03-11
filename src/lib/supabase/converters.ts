import type { Tables } from './types'
import type { User, Client, Master, Partner, Invoice, Ticket, KYCItem } from '@/lib/types'

// --- Formatters ---

export function formatINR(amount: number): string {
  if (amount === 0) return '\u20B90'
  const abs = Math.abs(amount)
  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000
    return `\u20B9${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)}Cr`
  }
  if (abs >= 1_00_000) {
    const l = abs / 1_00_000
    return `\u20B9${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`
  }
  return `\u20B9${abs.toLocaleString('en-IN')}`
}

export function formatPnl(amount: number): string {
  if (amount === 0) return '\u20B90'
  const sign = amount > 0 ? '+' : '\u2212'
  return `${sign}${formatINR(Math.abs(amount))}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function algoConfigToString(config: unknown, planAlgorithms?: string[]): string {
  if (planAlgorithms && planAlgorithms.length > 0) {
    if (planAlgorithms.length === 1) {
      const id = planAlgorithms[0]
      const names: Record<string, string> = { M1: 'ALPHA', M2: 'DELTA', M3: 'SIGMA' }
      return `${id} ${names[id] || id}`
    }
    return planAlgorithms.join('+')
  }
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const active = Object.entries(config as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (active.length === 0) return '\u2014'
    if (active.length === 1) {
      const names: Record<string, string> = { M1: 'ALPHA', M2: 'DELTA', M3: 'SIGMA' }
      return `${active[0]} ${names[active[0]] || active[0]}`
    }
    return active.join('+')
  }
  return '\u2014'
}

// --- Converters ---

export function dbUserToUser(row: Tables<'users'>): User {
  return {
    id: row.id,
    name: row.name,
    role: formatRole(row.role),
    type: ['super_admin', 'admin', 'support'].includes(row.role) ? 'admin' : 'client',
  }
}

export function dbClientToClient(
  row: Tables<'clients'>,
  user: Tables<'users'>,
  plan?: Tables<'plans'> | null,
  partner?: Tables<'partners'> | null,
  pnl?: number
): Client {
  return {
    id: row.client_id,
    name: user.name,
    type: user.account_type,
    mob: user.phone || '',
    email: user.email,
    pan: row.pan || '',
    plan: plan?.name || '\u2014',
    kyc: row.kyc_status,
    status: row.status,
    algo: algoConfigToString(row.algo_config, plan?.algorithms),
    partner: partner?.name || 'None',
    aum: row.aum > 0 ? formatINR(row.aum) : '\u2014',
    pnl: pnl !== undefined && pnl !== 0 ? formatPnl(pnl) : '\u2014',
    joined: formatDate(row.joined_at),
  }
}

export function dbMasterToMaster(row: Tables<'master_accounts'>): Master {
  return {
    id: row.id,
    name: `${row.name}`,
    assets: row.asset_class,
    clients: row.total_clients,
    pnl: formatPnl(row.total_pnl),
    status: row.status as 'active' | 'review',
    rate: row.success_rate !== null ? `${Math.round(row.success_rate)}%` : '0%',
    trades: row.total_trades,
  }
}

export function dbPartnerToPartner(row: Tables<'partners'>): Partner {
  return {
    id: row.id,
    name: row.name,
    clients: row.total_clients,
    aum: formatINR(row.total_aum),
    pnl: formatPnl(row.total_pnl),
    rev: formatINR(row.total_revenue),
    status: row.status as 'active' | 'review',
  }
}

export function dbInvoiceToInvoice(
  row: Tables<'invoices'>,
  clientName: string
): Invoice {
  return {
    id: row.invoice_number,
    client: clientName,
    amt: formatINR(row.total_amount),
    type: row.type,
    status: row.status as 'overdue' | 'pending' | 'paid',
    due: formatDate(row.due_date),
  }
}

export function dbTicketToTicket(
  row: Tables<'tickets'>,
  clientName: string
): Ticket {
  return {
    id: row.ticket_number,
    client: clientName,
    subj: row.subject,
    pri: row.priority,
    status: row.status === 'open' || row.status === 'in_progress' ? 'open' : 'resolved',
    time: formatRelativeTime(row.created_at),
  }
}

export function dbKycToKycItem(
  clientRow: Tables<'clients'>,
  userName: string,
  accountType: 'individual' | 'corporate',
  docs: Tables<'kyc_documents'>[]
): KYCItem {
  const docStatuses = docs.map((d) => {
    const label = d.document_type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const icon = d.status === 'verified' ? ' \u2713' : ' \u23F3'
    return `${label}${icon}`
  })

  const earliest = docs.reduce(
    (min, d) => (d.uploaded_at < min ? d.uploaded_at : min),
    docs[0]?.uploaded_at || new Date().toISOString()
  )

  return {
    id: clientRow.client_id,
    name: userName,
    type: accountType,
    docs: docStatuses,
    time: formatRelativeTime(earliest),
  }
}
