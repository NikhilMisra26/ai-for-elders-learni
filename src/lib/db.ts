import { supabase } from './supabaseClient';

export type Tier = 'free' | 'advanced' | 'expert';

export interface Profile {
  id: string; // auth.users id (uuid)
  email: string;
  name?: string;
  tier: Tier;
  verified: boolean;
  join_date: string;
  last_login_at?: string | null;
  login_attempts?: number;
  is_locked?: boolean;
  locked_until?: string | null;
}

export async function upsertProfile(profile: Profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile as any, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: Tier;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'grace_period';
  start_date: string;
  end_date?: string | null;
  next_billing_date?: string | null;
  trial_end_date?: string | null;
  grace_period_end?: string | null;
  payment_brand?: string | null;
  payment_last4?: string | null;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as SubscriptionRow | undefined) || undefined;
}

export async function upsertSubscription(
  row: Omit<SubscriptionRow, 'id'> & { id?: string },
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

export interface InvoiceRow {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  plan_name: string;
  status: 'paid' | 'pending' | 'failed';
  download_url?: string | null;
}

export async function listInvoices(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as InvoiceRow[]) || [];
}

export async function addInvoice(row: Omit<InvoiceRow, 'id'>) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as InvoiceRow;
}

export interface CourseProgressRow {
  id: string;
  user_id: string;
  course_id: string;
  started_at: string;
  last_accessed_at: string;
  completed_modules: string[];
  current_module_id?: string | null;
  total_time_spent: number;
  completion_percentage: number;
  completed: boolean;
  completed_at?: string | null;
}

export async function getCourseProgressRows(userId: string) {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data as CourseProgressRow[]) || [];
}

export async function upsertCourseProgress(
  row: Omit<CourseProgressRow, 'id'> & { id?: string },
) {
  const { data, error } = await supabase
    .from('course_progress')
    .upsert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as CourseProgressRow;
}

export interface ModuleProgressRow {
  id: string;
  user_id: string;
  module_id: string;
  course_id: string;
  completed_at: string;
  time_spent: number;
  rating?: number | null;
  attempts: number;
  notes?: string | null;
}

export async function getModuleProgressRows(userId: string) {
  const { data, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data as ModuleProgressRow[]) || [];
}

export async function upsertModuleProgress(
  row: Omit<ModuleProgressRow, 'id'> & { id?: string },
) {
  const { data, error } = await supabase
    .from('module_progress')
    .upsert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as ModuleProgressRow;
}

export interface UserActivityRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string | null;
  timestamp: string;
  course_id?: string | null;
  module_id?: string | null;
  metadata?: Record<string, any> | null;
}

export async function addUserActivity(row: Omit<UserActivityRow, 'id'>) {
  const { data, error } = await supabase
    .from('user_activity')
    .insert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as UserActivityRow;
}

export async function listUserActivity(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as UserActivityRow[]) || [];
}
