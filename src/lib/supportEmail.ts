import { supabase } from './supabaseClient';

export interface SendSupportEmailRequest {
  message: string;
}

export interface SendSupportEmailResponse {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Send a support email through the Supabase Edge Function
 * Includes rate limiting, validation, and secure email handling
 */
export async function sendSupportEmail(
  request: SendSupportEmailRequest,
): Promise<SendSupportEmailResponse> {
  try {
    // Validate message locally first
    if (!request.message || typeof request.message !== 'string') {
      return {
        success: false,
        error: 'Message is required',
      };
    }

    const trimmedMessage = request.message.trim();

    if (trimmedMessage.length < 10) {
      return {
        success: false,
        error: 'Message is too short (minimum 10 characters)',
      };
    }

    if (trimmedMessage.length > 5000) {
      return {
        success: false,
        error: 'Message is too long (maximum 5000 characters)',
      };
    }

    // Get the current session and validate it properly
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'You must be logged in to send a support request',
      };
    }

    // Additional session validation
    if (!session.user?.id || !session.user?.email) {
      return {
        success: false,
        error: 'Invalid session. Please sign in again.',
      };
    }

    // Check if session is about to expire
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

      if (minutesUntilExpiry < 5) {
        return {
          success: false,
          error: 'Your session is about to expire. Please sign in again.',
        };
      }
    }

    // Get the Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      // Error: VITE_SUPABASE_URL not configured
      return {
        success: false,
        error: 'Support service not configured',
      };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-support-email`;

    // Call the Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: trimmedMessage,
      }),
    });

    // Check response.ok BEFORE attempting to parse
    if (!response.ok) {
      // Check content-type header before parsing JSON for error details
      const contentType = response.headers.get('content-type');
      let data: { error?: string; ticketId?: string } = {};

      try {
        if (contentType?.includes('application/json')) {
          const responseText = await response.text();
          if (responseText.trim()) {
            data = JSON.parse(responseText) as { error?: string; ticketId?: string };
          }
        }
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse error response JSON:', parseError);
        // Continue with empty data object
      }
      // Handle rate limiting specifically
      if (response.status === 429) {
        return {
          success: false,
          error: data.error ?? 'Too many support requests. Please try again later.',
        };
      }

      // Handle other errors
      return {
        success: false,
        error: data.error ?? 'Failed to send support request',
      };
    }

    // Parse successful response
    let successData: { ticketId?: string; warning?: string } = {};
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const responseText = await response.text();
        if (responseText.trim()) {
          successData = JSON.parse(responseText) as { ticketId?: string; warning?: string };
        }
      }
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse success response JSON:', parseError);
    }

    return {
      success: true,
      ticketId: successData.ticketId,
    };
  } catch (error) {
    // Support email error
    // eslint-disable-next-line no-console
    console.error('Support email error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get the user's support tickets
 */
export async function getUserSupportTickets(): Promise<{
  success: boolean;
  tickets?: Array<{
    id: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'failed';
    created_at: string;
    resolved_at?: string;
    resolution_notes?: string;
  }>;
  error?: string;
}> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view support tickets',
      };
    }

    const { data: tickets, error } = (await supabase
      .from('support_tickets')
      .select('id, message, status, created_at, resolved_at, resolution_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })) as {
      data: Array<{
        id: string;
        message: string;
        status: 'pending' | 'in_progress' | 'resolved' | 'failed';
        created_at: string;
        resolved_at?: string;
        resolution_notes?: string;
      }> | null;
      error: Error | null;
    };

    if (error) {
      // Failed to fetch support tickets
      return {
        success: false,
        error: 'Failed to load support tickets',
      };
    }

    return {
      success: true,
      tickets: tickets ?? [],
    };
  } catch (error) {
    // Support tickets error
    // eslint-disable-next-line no-console
    console.error('Support tickets error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Check if the user can send a support email (rate limiting check)
 * Returns the number of minutes until they can send another email, or 0 if they can send now
 */
export async function checkSupportEmailRateLimit(): Promise<{
  canSend: boolean;
  minutesUntilNextAllowed: number;
  error?: string;
}> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        canSend: false,
        minutesUntilNextAllowed: 0,
        error: 'You must be logged in to send support requests',
      };
    }

    // Check tickets sent in the last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: recentTickets, error } = await supabase
      .from('support_tickets')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (error) {
      // Rate limit check failed - return error to user instead of failing open
      console.error('Rate limit database check failed:', error);
      return {
        canSend: false,
        minutesUntilNextAllowed: 0,
        error: 'Unable to check rate limits. Please try again later.',
      };
    }

    const maxRequestsPerHour = 3;

    if (recentTickets && recentTickets.length >= maxRequestsPerHour) {
      // Calculate when the oldest ticket will expire from the rate limit window
      const oldestTicket = recentTickets[maxRequestsPerHour - 1];
      const oldestTime = new Date(oldestTicket.created_at as string).getTime();
      const nextAllowedTime = oldestTime + 3600000; // 1 hour after oldest
      const minutesUntilAllowed = Math.ceil((nextAllowedTime - Date.now()) / 60000);

      return {
        canSend: false,
        minutesUntilNextAllowed: Math.max(0, minutesUntilAllowed),
      };
    }

    return {
      canSend: true,
      minutesUntilNextAllowed: 0,
    };
  } catch (error) {
    // Rate limit check error
    // eslint-disable-next-line no-console
    console.error('Rate limit check error:', error);
    // Fail open on error
    return {
      canSend: true,
      minutesUntilNextAllowed: 0,
    };
  }
}
