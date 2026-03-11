export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          name: string
          role: 'super_admin' | 'admin' | 'support' | 'client'
          account_type: 'individual' | 'corporate'
          avatar_url: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          name: string
          role?: 'super_admin' | 'admin' | 'support' | 'client'
          account_type?: 'individual' | 'corporate'
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          name?: string
          role?: 'super_admin' | 'admin' | 'support' | 'client'
          account_type?: 'individual' | 'corporate'
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          client_id: string
          pan: string | null
          plan_id: string | null
          kyc_status: 'pending' | 'verified' | 'rejected'
          partner_id: string | null
          algo_config: Json
          aum: number
          status: 'active' | 'pending' | 'inactive'
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          pan?: string | null
          plan_id?: string | null
          kyc_status?: 'pending' | 'verified' | 'rejected'
          partner_id?: string | null
          algo_config?: Json
          aum?: number
          status?: 'active' | 'pending' | 'inactive'
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          pan?: string | null
          plan_id?: string | null
          kyc_status?: 'pending' | 'verified' | 'rejected'
          partner_id?: string | null
          algo_config?: Json
          aum?: number
          status?: 'active' | 'pending' | 'inactive'
          joined_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          price: number | null
          billing_type: 'fixed_quarterly' | 'profit_sharing'
          profit_share_pct: number | null
          algorithms: string[]
          features: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price?: number | null
          billing_type: 'fixed_quarterly' | 'profit_sharing'
          profit_share_pct?: number | null
          algorithms?: string[]
          features?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price?: number | null
          billing_type?: 'fixed_quarterly' | 'profit_sharing'
          profit_share_pct?: number | null
          algorithms?: string[]
          features?: Json
          is_active?: boolean
          created_at?: string
        }
      }
      master_accounts: {
        Row: {
          id: string
          name: string
          asset_class: string
          status: 'active' | 'review' | 'inactive'
          success_rate: number | null
          total_trades: number
          total_pnl: number
          total_clients: number
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          asset_class: string
          status?: 'active' | 'review' | 'inactive'
          success_rate?: number | null
          total_trades?: number
          total_pnl?: number
          total_clients?: number
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          asset_class?: string
          status?: 'active' | 'review' | 'inactive'
          success_rate?: number | null
          total_trades?: number
          total_pnl?: number
          total_clients?: number
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          user_id: string | null
          name: string
          total_clients: number
          total_aum: number
          total_pnl: number
          total_revenue: number
          status: 'active' | 'review' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          total_clients?: number
          total_aum?: number
          total_pnl?: number
          total_revenue?: number
          status?: 'active' | 'review' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          total_clients?: number
          total_aum?: number
          total_pnl?: number
          total_revenue?: number
          status?: 'active' | 'review' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      kyc_documents: {
        Row: {
          id: string
          client_id: string
          document_type: string
          file_url: string | null
          file_name: string | null
          status: 'pending' | 'verified' | 'rejected'
          reviewer_id: string | null
          reviewer_note: string | null
          reviewed_at: string | null
          uploaded_at: string
          digilocker_doc_id: string | null
          digilocker_verified: boolean
        }
        Insert: {
          id?: string
          client_id: string
          document_type: string
          file_url?: string | null
          file_name?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          reviewer_id?: string | null
          reviewer_note?: string | null
          reviewed_at?: string | null
          uploaded_at?: string
          digilocker_doc_id?: string | null
          digilocker_verified?: boolean
        }
        Update: {
          id?: string
          client_id?: string
          document_type?: string
          file_url?: string | null
          file_name?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          reviewer_id?: string | null
          reviewer_note?: string | null
          reviewed_at?: string | null
          uploaded_at?: string
          digilocker_doc_id?: string | null
          digilocker_verified?: boolean
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          client_id: string
          amount: number
          gst_amount: number
          total_amount: number
          type: string
          status: 'pending' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_at: string | null
          payment_method: string | null
          payment_ref: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          client_id: string
          amount: number
          gst_amount?: number
          total_amount: number
          type: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          client_id?: string
          amount?: number
          gst_amount?: number
          total_amount?: number
          type?: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          invoice_id: string | null
          client_id: string
          amount: number
          type: 'payment' | 'refund' | 'adjustment'
          gateway: string
          gateway_ref: string | null
          status: 'pending' | 'success' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id?: string | null
          client_id: string
          amount: number
          type: 'payment' | 'refund' | 'adjustment'
          gateway?: string
          gateway_ref?: string | null
          status?: 'pending' | 'success' | 'failed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string | null
          client_id?: string
          amount?: number
          type?: 'payment' | 'refund' | 'adjustment'
          gateway?: string
          gateway_ref?: string | null
          status?: 'pending' | 'success' | 'failed' | 'refunded'
          created_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          master_id: string
          client_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          pnl: number
          status: 'open' | 'closed' | 'cancelled'
          executed_at: string
        }
        Insert: {
          id?: string
          master_id: string
          client_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          pnl?: number
          status?: 'open' | 'closed' | 'cancelled'
          executed_at?: string
        }
        Update: {
          id?: string
          master_id?: string
          client_id?: string
          symbol?: string
          side?: 'buy' | 'sell'
          quantity?: number
          price?: number
          pnl?: number
          status?: 'open' | 'closed' | 'cancelled'
          executed_at?: string
        }
      }
      pnl_snapshots: {
        Row: {
          id: string
          client_id: string
          master_id: string
          date: string
          daily_pnl: number
          cumulative_pnl: number
          aum: number
          drawdown_pct: number
        }
        Insert: {
          id?: string
          client_id: string
          master_id: string
          date: string
          daily_pnl?: number
          cumulative_pnl?: number
          aum?: number
          drawdown_pct?: number
        }
        Update: {
          id?: string
          client_id?: string
          master_id?: string
          date?: string
          daily_pnl?: number
          cumulative_pnl?: number
          aum?: number
          drawdown_pct?: number
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          client_id: string
          subject: string
          description: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_number: string
          client_id: string
          subject: string
          description?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          client_id?: string
          subject?: string
          description?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          message: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          message: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          message?: string
          is_internal?: boolean
          created_at?: string
        }
      }
      exchange_connections: {
        Row: {
          id: string
          client_id: string
          exchange: string
          api_key_hash: string
          api_secret_hash: string
          is_active: boolean
          last_verified: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          exchange?: string
          api_key_hash: string
          api_secret_hash: string
          is_active?: boolean
          last_verified?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          exchange?: string
          api_key_hash?: string
          api_secret_hash?: string
          is_active?: boolean
          last_verified?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
      notification_templates: {
        Row: {
          id: string
          name: string
          channel: 'email' | 'sms' | 'push' | 'in_app'
          subject: string | null
          body_template: string
          variables: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          channel: 'email' | 'sms' | 'push' | 'in_app'
          subject?: string | null
          body_template: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          channel?: 'email' | 'sms' | 'push' | 'in_app'
          subject?: string | null
          body_template?: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          channel: 'email' | 'sms' | 'push' | 'in_app'
          title: string
          body: string
          data: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          channel: 'email' | 'sms' | 'push' | 'in_app'
          title: string
          body: string
          data?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          channel?: 'email' | 'sms' | 'push' | 'in_app'
          title?: string
          body?: string
          data?: Json
          read_at?: string | null
          created_at?: string
        }
      }
      billing_cycles: {
        Row: {
          id: string
          client_id: string
          cycle_start: string
          cycle_end: string
          starting_aum: number
          ending_aum: number
          gross_pnl: number
          platform_share: number
          invoice_id: string | null
          status: 'open' | 'closed' | 'invoiced'
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          cycle_start: string
          cycle_end: string
          starting_aum?: number
          ending_aum?: number
          gross_pnl?: number
          platform_share?: number
          invoice_id?: string | null
          status?: 'open' | 'closed' | 'invoiced'
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          cycle_start?: string
          cycle_end?: string
          starting_aum?: number
          ending_aum?: number
          gross_pnl?: number
          platform_share?: number
          invoice_id?: string | null
          status?: 'open' | 'closed' | 'invoiced'
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      generate_client_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_dashboard_kpis: {
        Args: Record<string, never>
        Returns: Json
      }
      get_client_pnl_summary: {
        Args: { p_client_id: string }
        Returns: Json
      }
      calculate_traas_billing: {
        Args: { p_cycle_id: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
