import type { SupabaseClient } from '@supabase/supabase-js'

export function subscribeToPnlUpdates(
  supabase: SupabaseClient,
  clientId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`pnl-updates-${clientId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pnl_snapshots', filter: `client_id=eq.${clientId}` },
      (payload) => onUpdate(payload.new as Record<string, unknown>)
    )
    .subscribe()
}

export function subscribeToTradeFeed(
  supabase: SupabaseClient,
  clientId: string,
  onTrade: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`trade-feed-${clientId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'trades', filter: `client_id=eq.${clientId}` },
      (payload) => onTrade(payload.new as Record<string, unknown>)
    )
    .subscribe()
}

export function subscribeToKycStatus(
  supabase: SupabaseClient,
  clientId: string,
  onUpdate: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`kyc-status-${clientId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'kyc_documents', filter: `client_id=eq.${clientId}` },
      (payload) => onUpdate(payload.new as Record<string, unknown>)
    )
    .subscribe()
}

export function subscribeToTicketMessages(
  supabase: SupabaseClient,
  ticketId: string,
  onMessage: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`ticket-messages-${ticketId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
      (payload) => onMessage(payload.new as Record<string, unknown>)
    )
    .subscribe()
}

export function subscribeToNotifications(
  supabase: SupabaseClient,
  userId: string,
  onNotification: (payload: Record<string, unknown>) => void
) {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNotification(payload.new as Record<string, unknown>)
    )
    .subscribe()
}
