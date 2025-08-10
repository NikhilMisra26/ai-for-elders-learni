/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { supabase } from './supabaseClient';
import { sanitizeInput, validateEmail } from './security';

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

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const emailCheck = validateEmail(profile.email);
  if (!emailCheck.isValid) throw new Error(emailCheck.errors.join(', '));

  const sanitized: Profile = {
    ...profile,
    email: profile.email.trim().toLowerCase(),
    name: profile.name ? sanitizeInput(profile.name) : undefined,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(sanitized, { onConflict: 'id' })
    .select()
    .single();
  if (error || !data) throw error;
  return data;
}

export async function getProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  updates: Partial<Profile>,
): Promise<Profile> {
  const sanitized: Partial<Profile> = { ...updates };

  if (updates.email) {
    const emailCheck = validateEmail(updates.email);
    if (!emailCheck.isValid) throw new Error(emailCheck.errors.join(', '));
    sanitized.email = updates.email.trim().toLowerCase();
  }

  if (updates.name) sanitized.name = sanitizeInput(updates.name);
  const { data, error } = await supabase
    .from('profiles')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) throw error;
  return data;
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

export async function getUserSubscription(
  userId: string,
): Promise<SubscriptionRow | undefined> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as SubscriptionRow | undefined) ?? undefined;
}

export async function upsertSubscription(
  row: Omit<SubscriptionRow, 'id'> & { id?: string },
): Promise<SubscriptionRow> {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(row)
    .select()
    .single();
  if (error || !data) throw error;
  return data;
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

export async function listInvoices(userId: string): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function addInvoice(
  row: Omit<InvoiceRow, 'id'>,
): Promise<InvoiceRow> {
  const { data, error } = await supabase
    .from('invoices')
    .insert([row])
    .select()
    .single();
  if (error || !data) throw error;
  return data;
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

export async function getCourseProgressRows(
  userId: string,
): Promise<CourseProgressRow[]> {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertCourseProgress(
  row: Omit<CourseProgressRow, 'id'> & { id?: string },
): Promise<CourseProgressRow> {
  const { data, error } = await supabase
    .from('course_progress')
    .upsert(row)
    .select()
    .single();
  if (error || !data) throw error;
  return data;
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

export async function getModuleProgressRows(
  userId: string,
): Promise<ModuleProgressRow[]> {
  const { data, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertModuleProgress(
  row: Omit<ModuleProgressRow, 'id'> & { id?: string },
): Promise<ModuleProgressRow> {
  const { data, error } = await supabase
    .from('module_progress')
    .upsert(row)
    .select()
    .single();
  if (error || !data) throw error;
  return data;
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
  metadata?: Record<string, unknown> | null;
}

export async function addUserActivity(
  row: Omit<UserActivityRow, 'id'>,
): Promise<UserActivityRow> {
  const { data, error } = await supabase
    .from('user_activity')
    .insert(row)
    .select()
    .single();
  if (error || !data) throw error;
  return data;
}

export async function listUserActivity(
  userId: string,
  limit = 50,
): Promise<UserActivityRow[]> {
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
