/**
 * Supabase Edge Function: validate-access
 * 
 * Server-side endpoint for validating course content access.
 * This function runs on Supabase Edge Functions (Deno runtime)
 * and provides secure, server-side validation of user access rights.
 * 
 * Deploy with: supabase functions deploy validate-access
 */

// @ts-ignore - Deno runtime imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Deno runtime imports  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Deno global type declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Types
interface AccessValidationRequest {
  resourceType: 'course' | 'module' | 'lesson';
  resourceId: string;
  requiredTier: 'free' | 'advanced' | 'expert';
  metadata?: Record<string, unknown>;
}

interface AccessValidationResponse {
  granted: boolean;
  reason?: string;
  userTier?: string;
  upgradeRequired?: string;
  message?: string;
  cached?: boolean;
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier hierarchy for access checking
const TIER_HIERARCHY: Record<string, number> = {
  free: 1,
  advanced: 2,
  expert: 3,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          granted: false,
          reason: 'unauthenticated',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          granted: false,
          reason: 'invalid_token',
          message: 'Invalid authentication token',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: AccessValidationRequest = await req.json();
    const { resourceType, resourceId, requiredTier, metadata } = body;

    // Validate required fields
    if (!resourceType || !resourceId || !requiredTier) {
      return new Response(
        JSON.stringify({
          granted: false,
          reason: 'invalid_request',
          message: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, end_date, grace_period_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      // No subscription found - default to free tier
      const hasFreeAccess = requiredTier === 'free';
      
      // Log the access attempt
      await logAccessAttempt(supabase, {
        user_id: user.id,
        resource_type: resourceType,
        resource_id: resourceId,
        required_tier: requiredTier,
        user_tier: 'free',
        access_granted: hasFreeAccess,
        denial_reason: hasFreeAccess ? null : 'no_subscription',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({
          granted: hasFreeAccess,
          reason: hasFreeAccess ? 'authenticated' : 'no_subscription',
          userTier: 'free',
          upgradeRequired: hasFreeAccess ? undefined : requiredTier,
          message: hasFreeAccess ? undefined : 'Subscription required for this content',
        }),
        {
          status: hasFreeAccess ? 200 : 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check subscription status
    if (subscription.status === 'expired') {
      const hasFreeAccess = requiredTier === 'free';
      
      await logAccessAttempt(supabase, {
        user_id: user.id,
        resource_type: resourceType,
        resource_id: resourceId,
        required_tier: requiredTier,
        user_tier: 'free',
        access_granted: hasFreeAccess,
        denial_reason: hasFreeAccess ? null : 'subscription_expired',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

      return new Response(
        JSON.stringify({
          granted: hasFreeAccess,
          reason: 'expired',
          userTier: 'free',
          upgradeRequired: hasFreeAccess ? undefined : requiredTier,
          message: 'Your subscription has expired',
        }),
        {
          status: hasFreeAccess ? 200 : 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check grace period
    if (subscription.status === 'grace_period' && subscription.grace_period_end) {
      const graceEnd = new Date(subscription.grace_period_end);
      if (new Date() > graceEnd) {
        const hasFreeAccess = requiredTier === 'free';
        
        await logAccessAttempt(supabase, {
          user_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId,
          required_tier: requiredTier,
          user_tier: 'free',
          access_granted: hasFreeAccess,
          denial_reason: hasFreeAccess ? null : 'grace_period_ended',
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        });

        return new Response(
          JSON.stringify({
            granted: hasFreeAccess,
            reason: 'grace_period_ended',
            userTier: 'free',
            upgradeRequired: hasFreeAccess ? undefined : requiredTier,
            message: 'Your grace period has ended',
          }),
          {
            status: hasFreeAccess ? 200 : 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check tier access
    const userTierLevel = TIER_HIERARCHY[subscription.plan_id] || 1;
    const requiredTierLevel = TIER_HIERARCHY[requiredTier] || 1;
    const hasAccess = userTierLevel >= requiredTierLevel;

    // Log the access attempt
    await logAccessAttempt(supabase, {
      user_id: user.id,
      resource_type: resourceType,
      resource_id: resourceId,
      required_tier: requiredTier,
      user_tier: subscription.plan_id,
      access_granted: hasAccess,
      denial_reason: hasAccess ? null : 'insufficient_tier',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Additional content validation if access is granted
    if (hasAccess && resourceType === 'module') {
      // Verify the module exists and is active
      const isValidContent = await validateContentExists(
        supabase,
        resourceId,
        metadata?.courseId as string
      );

      if (!isValidContent) {
        return new Response(
          JSON.stringify({
            granted: false,
            reason: 'content_not_found',
            message: 'The requested content is not available',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Return access decision
    const response: AccessValidationResponse = {
      granted: hasAccess,
      reason: hasAccess ? 'authenticated' : 'tier_mismatch',
      userTier: subscription.plan_id,
      upgradeRequired: hasAccess ? undefined : requiredTier,
      message: hasAccess
        ? undefined
        : `This content requires ${requiredTier} tier access`,
    };

    return new Response(JSON.stringify(response), {
      status: hasAccess ? 200 : 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Access validation error:', error);
    
    // Log error for monitoring
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase.from('error_logs').insert({
      function_name: 'validate-access',
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        granted: false,
        reason: 'internal_error',
        message: 'An error occurred while validating access',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Helper function to log access attempts
 */
async function logAccessAttempt(supabase: any, attempt: any) {
  try {
    await supabase.from('access_attempts').insert({
      ...attempt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log access attempt:', error);
    // Don't throw - logging failure shouldn't break access validation
  }
}

/**
 * Helper function to validate content exists
 */
async function validateContentExists(
  supabase: any,
  moduleId: string,
  courseId?: string
): Promise<boolean> {
  // This would check against your content database
  // For now, return true as placeholder
  // In production, you'd query your content tables
  return true;
}