// ============================================================================
// Support Ticket System Type Definitions
// Generated from Supabase schema for type-safe operations
// ============================================================================

/**
 * Support ticket status types
 */
export type TicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

/**
 * Support ticket priority levels
 */
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Support ticket categories
 */
export type TicketCategory =
  | 'general'
  | 'technical'
  | 'billing'
  | 'account'
  | 'course_content'
  | 'other';

/**
 * Rate limiting action types
 */
export type RateLimitAction = 'ticket_create' | 'email_send';

/**
 * Main support ticket interface matching database schema
 */
export interface SupportTicket {
  id: string;
  user_id: string;

  // Ticket content
  message: string;
  status: TicketStatus;

  // Denormalized user data
  user_email: string;
  user_name: string | null;
  user_tier: string | null;

  // Response tracking
  admin_response: string | null;
  admin_id: string | null;
  responded_at: string | null;
  resolved_at: string | null;

  // Metadata
  priority: TicketPriority;
  category: TicketCategory;

  // Audit columns
  created_at: string;
  updated_at: string;
}

/**
 * Type for creating a new support ticket
 * Omits auto-generated fields and admin-only fields
 */
export type SupportTicketInsert = Pick<SupportTicket, 'message' | 'category' | 'priority'> & {
  user_id?: string; // Optional, will use auth.uid() if not provided
  user_email?: string; // Optional, will be auto-populated
  user_name?: string; // Optional, will be auto-populated
  user_tier?: string; // Optional, will be auto-populated
};

/**
 * Type for updating a support ticket
 * Users can only update message on pending tickets
 * Admins can update more fields
 */
export type SupportTicketUpdate = Partial<
  Pick<
    SupportTicket,
    | 'message'
    | 'status'
    | 'priority'
    | 'category'
    | 'admin_response'
    | 'admin_id'
    | 'responded_at'
    | 'resolved_at'
  >
>;

/**
 * Rate limiting entry interface
 */
export interface RateLimitEntry {
  id: string;
  user_id: string;
  action_type: RateLimitAction;
  created_at: string;
}

/**
 * Type for rate limiting check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  limit: number;
  window_minutes: number;
}

/**
 * Support ticket statistics for dashboard
 */
export interface TicketStatistics {
  total_tickets: number;
  pending_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  average_response_time: number | null; // in hours
  average_resolution_time: number | null; // in hours
}

/**
 * Filter options for querying support tickets
 */
export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  category?: TicketCategory | TicketCategory[];
  date_from?: string;
  date_to?: string;
  search_term?: string;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'updated_at' | 'priority';
  order_direction?: 'asc' | 'desc';
}

/**
 * Response type for paginated ticket queries
 */
export interface TicketListResponse {
  tickets: SupportTicket[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Type guard to check if a value is a valid ticket status
 */
export function isValidTicketStatus(value: unknown): value is TicketStatus {
  return (
    typeof value === 'string' && ['pending', 'in_progress', 'resolved', 'closed'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid ticket priority
 */
export function isValidTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === 'string' && ['low', 'normal', 'high', 'urgent'].includes(value);
}

/**
 * Type guard to check if a value is a valid ticket category
 */
export function isValidTicketCategory(value: unknown): value is TicketCategory {
  return (
    typeof value === 'string' &&
    ['general', 'technical', 'billing', 'account', 'course_content', 'other'].includes(value)
  );
}

/**
 * Helper to get priority display label
 */
export function getPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority];
}

/**
 * Helper to get status display label
 */
export function getStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status];
}

/**
 * Helper to get category display label
 */
export function getCategoryLabel(category: TicketCategory): string {
  const labels: Record<TicketCategory, string> = {
    general: 'General Inquiry',
    technical: 'Technical Issue',
    billing: 'Billing & Subscription',
    account: 'Account Management',
    course_content: 'Course Content',
    other: 'Other',
  };
  return labels[category];
}

/**
 * Helper to get priority color for UI styling
 */
export function getPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'text-gray-600',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };
  return colors[priority];
}

/**
 * Helper to get status color for UI styling
 */
export function getStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colors[status];
}
