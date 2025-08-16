// This file runs on Deno (Supabase Edge Functions) but is type-checked in a Node/tsc project.
// Provide light ambient typings so tsc doesn't error while keeping Deno runtime behavior.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// tsc in this workspace cannot resolve Deno's npm: specifier; ignore for types only.
// @ts-ignore - Deno npm specifier not resolvable by Node/tsc
import { createClient } from 'npm:@supabase/supabase-js@2';

// Type definitions
interface SupportEmailRequest {
  message: string;
}

// CORS headers for your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3;

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&'"]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return escapeMap[char] ?? char;
    })
    .trim()
    .slice(0, 5000); // Limit message length
}

// Check rate limiting
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Check recent support tickets from this user
    const { data: recentTickets, error } = await supabase
      .from('support_tickets')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow the request if we can't check
      return { allowed: true };
    }

    if (recentTickets && recentTickets.length >= RATE_LIMIT_MAX_REQUESTS) {
      const oldestAllowed = recentTickets[RATE_LIMIT_MAX_REQUESTS - 1];
      const nextAllowedTime = new Date(
        new Date(oldestAllowed.created_at).getTime() + RATE_LIMIT_WINDOW_MS,
      );
      const minutesUntilAllowed = Math.ceil((nextAllowedTime.getTime() - Date.now()) / 60000);

      return {
        allowed: false,
        reason: `Too many support requests. Please try again in ${minutesUntilAllowed} minutes.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open on error
    return { allowed: true };
  }
}

// Send email via Resend API
async function sendEmail(
  userEmail: string,
  userName: string,
  userId: string,
  message: string,
  ticketId: string,
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const supportFrom =
    Deno.env.get('SUPPORT_FROM_EMAIL') ?? 'Discover 50 AI Support <onboarding@resend.dev>';
  const supportInbox = Deno.env.get('SUPPORT_INBOX_EMAIL') ?? 'discover50ai@gmail.com';

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const emailBody = `
User: ${userName} (${userEmail})
User ID: ${userId}
Ticket ID: ${ticketId}
Date: ${new Date().toISOString()}

Message:
${message}

---
This is an automated support ticket from DISCOVER 50 AI
To reply to this user, send an email to: ${userEmail}
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: supportFrom,
        to: [supportInbox],
        subject: `Support Request from ${userName}`,
        text: emailBody,
        reply_to: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Main handler using Deno.serve (modern pattern)
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);

    // Verify the JWT and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    let body: SupportEmailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.message || typeof body.message !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(body.message);

    if (sanitizedMessage.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too short (minimum 10 characters)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(supabaseAdmin, user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: rateLimit.reason }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, email, tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      // Continue with user email if profile not found
    }

    // Create support ticket record
    const ticketData = {
      user_id: user.id,
      user_email: profile?.email || user.email || 'unknown@email.com',
      user_name: profile?.name || 'User',
      user_tier: profile?.tier || 'free',
      message: sanitizedMessage,
      status: 'pending' as const,
    };

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Failed to create support ticket:', ticketError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create support ticket' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Record rate limiting entry
    await supabaseAdmin.from('rate_limiting_support').insert({
      user_id: user.id,
      action_type: 'ticket_create',
    });

    // Send email
    const emailResult = await sendEmail(
      ticketData.user_email,
      ticketData.user_name,
      user.id,
      sanitizedMessage,
      ticket.id,
    );

    if (!emailResult.success) {
      // Update ticket status to failed
      await supabaseAdmin
        .from('support_tickets')
        .update({ status: 'failed', error_message: emailResult.error })
        .eq('id', ticket.id);

      // Still return success for ticket creation, but note email failure
      return new Response(
        JSON.stringify({
          success: true,
          ticketId: ticket.id,
          warning:
            'Ticket created but email notification failed. Support team will check pending tickets.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Log security action if security_logs table exists
    try {
      await supabaseAdmin.from('security_logs').insert({
        user_id: user.id,
        action: 'support_email_sent',
        details: { ticket_id: ticket.id },
        success: true,
      });
    } catch (error) {
      // Ignore if security_logs table doesn't exist
      console.log('Security logging skipped:', error);
    }

    // Return success response
    return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ success: false, error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
