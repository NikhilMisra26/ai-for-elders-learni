import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

// CORS headers for your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3;

// Input validation schema
interface SupportEmailRequest {
  message: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

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
  userId: string
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
        new Date(oldestAllowed.created_at).getTime() + RATE_LIMIT_WINDOW_MS
      );
      const minutesUntilAllowed = Math.ceil(
        (nextAllowedTime.getTime() - Date.now()) / 60000
      );
      
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
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
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
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DISCOVER 50 AI Support <noreply@discover50ai.com>',
        to: ['discover50ai@gmail.com'],
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request body
    let body: SupportEmailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(body.message);
    
    if (sanitizedMessage.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too short (minimum 10 characters)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(supabaseAdmin, user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: rateLimit.reason }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user profile details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create support ticket record
    const ticketData = {
      user_id: user.id,
      user_email: profile.email || user.email || 'unknown',
      user_name: profile.name || 'User',
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
        }
      );
    }

    // Send email
    const emailResult = await sendEmail(
      ticketData.user_email,
      ticketData.user_name,
      user.id,
      sanitizedMessage,
      ticket.id
    );

    if (!emailResult.success) {
      // Update ticket status to failed
      await supabaseAdmin
        .from('support_tickets')
        .update({ status: 'failed', error_message: emailResult.error })
        .eq('id', ticket.id);

      return new Response(
        JSON.stringify({ success: false, error: emailResult.error }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log security action
    await supabaseAdmin
      .from('security_logs')
      .insert({
        user_id: user.id,
        action: 'support_email_sent',
        details: { ticket_id: ticket.id },
        success: true,
      });

    // Return success response
    return new Response(
      JSON.stringify({ success: true, ticketId: ticket.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});