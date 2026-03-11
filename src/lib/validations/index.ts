import { z } from 'zod'

// --- Clients ---

export const createClientSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().regex(/^\+91\s?\d{10}$/, 'Must be +91 followed by 10 digits'),
  account_type: z.enum(['individual', 'corporate']),
  pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format').optional(),
  plan_id: z.string().uuid().optional(),
  partner_id: z.string().uuid().optional(),
})

export const updateClientSchema = z.object({
  pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/).optional(),
  plan_id: z.string().uuid().nullable().optional(),
  partner_id: z.string().uuid().nullable().optional(),
  kyc_status: z.enum(['pending', 'verified', 'rejected']).optional(),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
  algo_config: z.record(z.string(), z.boolean()).optional(),
})

// --- Tickets ---

export const createTicketSchema = z.object({
  client_id: z.string().uuid(),
  subject: z.string().min(3).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
})

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

export const createTicketMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  is_internal: z.boolean().default(false),
})

// --- Invoices ---

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  amount: z.number().positive(),
  gst_amount: z.number().min(0).default(0),
  type: z.string().min(1),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
})

export const updateInvoiceSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  payment_method: z.string().optional(),
  payment_ref: z.string().optional(),
})

// --- KYC ---

export const reviewKycSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  reviewer_note: z.string().max(1000).optional(),
})

// --- Partners ---

export const createPartnerSchema = z.object({
  name: z.string().min(2).max(200),
  user_id: z.string().uuid().optional(),
})

export const updatePartnerSchema = z.object({
  status: z.enum(['active', 'review', 'inactive']).optional(),
  name: z.string().min(2).max(200).optional(),
})

// --- Users ---

export const updateUserRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'support', 'client']),
})

// --- Plans ---

export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  price: z.number().positive().nullable().optional(),
  billing_type: z.enum(['fixed_quarterly', 'profit_sharing']),
  profit_share_pct: z.number().min(0).max(100).nullable().optional(),
  algorithms: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
})

// --- Notification Templates ---

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  channel: z.enum(['email', 'sms', 'push', 'in_app']),
  subject: z.string().max(500).optional(),
  body_template: z.string().min(1).max(5000),
  variables: z.array(z.string()).default([]),
})

// --- Query params ---

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const clientFilterSchema = paginationSchema.extend({
  status: z.enum(['active', 'pending', 'inactive']).optional(),
  kyc: z.enum(['pending', 'verified', 'rejected']).optional(),
  plan: z.string().optional(),
  search: z.string().optional(),
})
