/**
 * AccessManager - Comprehensive course access control service
 *
 * This module provides robust server-side and client-side validation
 * for course content access based on user subscription tiers.
 *
 * Security principles:
 * 1. Never trust client-side validation alone
 * 2. Always verify access rights at the server level
 * 3. Log all access attempts for security monitoring
 * 4. Fail securely - deny by default
 */

import { supabase } from './supabaseClient';
import { SecurityLogger } from './security';
import { errorHandler } from './errorHandler';
import type { Tier } from './db';

// ========================================================================
// Types and Interfaces
// ========================================================================

export interface AccessRequest {
  userId: string;
  resourceType: 'course' | 'module' | 'lesson';
  resourceId: string;
  requiredTier: Tier;
  metadata?: Record<string, unknown>;
}

export interface AccessResponse {
  granted: boolean;
  reason?: 'authenticated' | 'tier_mismatch' | 'expired' | 'locked' | 'invalid';
  userTier?: Tier;
  upgradeRequired?: Tier;
  message?: string;
}

export interface AccessAttempt {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  required_tier: Tier;
  user_tier: Tier;
  access_granted: boolean;
  denial_reason?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  suspicious?: boolean;
}

export interface ContentGate {
  courseId: string;
  moduleId?: string;
  requiredTier: Tier;
  enforceServerSide: boolean;
  fallbackContent?: string;
  upgradePrompt?: boolean;
}

// ========================================================================
// Core Access Control Logic
// ========================================================================

export class AccessManager {
  private static instance: AccessManager;
  private readonly accessCache: Map<
    string,
    { result: AccessResponse; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache
  private readonly MAX_ATTEMPTS_PER_MINUTE = 100;
  private readonly attemptCounter: Map<string, number[]> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AccessManager {
    if (!AccessManager.instance) {
      AccessManager.instance = new AccessManager();
    }
    return AccessManager.instance;
  }

  /**
   * Validates user access to a resource
   * This is the main entry point for all access checks
   */
  public async validateAccess(request: AccessRequest): Promise<AccessResponse> {
    try {
      // Check rate limiting
      if (this.isRateLimited(request.userId)) {
        await this.logAccessAttempt(request, false, 'rate_limited');
        return {
          granted: false,
          reason: 'invalid',
          message: 'Too many access attempts. Please try again later.',
        };
      }

      // Check cache first
      const cached = this.getCachedAccess(request);
      if (cached) return cached;

      // Perform server-side validation
      const response = await this.performServerValidation(request);

      // Cache the result
      this.cacheAccessResult(request, response);

      // Log the attempt
      await this.logAccessAttempt(request, response.granted, response.reason);

      return response;
    } catch (error) {
      errorHandler.logError(
        'access validation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: request.userId,
          metadata: {
            resourceId: request.resourceId,
            resourceType: request.resourceType,
          },
        },
      );

      // Fail securely - deny access on error
      return {
        granted: false,
        reason: 'invalid',
        message: 'Access validation failed. Please try again.',
      };
    }
  }

  /**
   * Performs server-side validation against the database
   */
  private async performServerValidation(
    request: AccessRequest,
  ): Promise<AccessResponse> {
    // Get user's current subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, end_date, grace_period_end')
      .eq('user_id', request.userId)
      .single();

    if (subError || !subscription) {
      return {
        granted: false,
        reason: 'invalid',
        message: 'Unable to verify subscription status.',
      };
    }

    // Check subscription status
    if (subscription.status === 'expired') {
      return {
        granted: false,
        reason: 'expired',
        userTier: subscription.plan_id,
        upgradeRequired: request.requiredTier,
        message: 'Your subscription has expired.',
      };
    }

    // Check if in grace period
    if (
      subscription.status === 'grace_period' &&
      subscription.grace_period_end
    ) {
      const graceEnd = new Date(subscription.grace_period_end);
      if (new Date() > graceEnd) {
        return {
          granted: false,
          reason: 'expired',
          userTier: 'free',
          upgradeRequired: request.requiredTier,
          message: 'Your grace period has ended.',
        };
      }
    }

    // Check tier access
    const hasAccess = this.checkTierAccess(
      subscription.plan_id,
      request.requiredTier,
    );

    if (!hasAccess) {
      return {
        granted: false,
        reason: 'tier_mismatch',
        userTier: subscription.plan_id,
        upgradeRequired: request.requiredTier,
        message: `This content requires ${request.requiredTier} tier access.`,
      };
    }

    // Access granted
    return {
      granted: true,
      reason: 'authenticated',
      userTier: subscription.plan_id,
    };
  }

  /**
   * Checks if user's tier meets the requirement
   */
  private checkTierAccess(userTier: Tier, requiredTier: Tier): boolean {
    const tierHierarchy: Record<Tier, number> = {
      free: 1,
      advanced: 2,
      expert: 3,
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  /**
   * Validates content access with additional security checks
   */
  public async validateContentAccess(
    userId: string,
    contentGate: ContentGate,
  ): Promise<AccessResponse> {
    // Additional validation for specific content types
    const request: AccessRequest = {
      userId,
      resourceType: contentGate.moduleId ? 'module' : 'course',
      resourceId: contentGate.moduleId || contentGate.courseId,
      requiredTier: contentGate.requiredTier,
      metadata: {
        courseId: contentGate.courseId,
        moduleId: contentGate.moduleId,
      },
    };

    const response = await this.validateAccess(request);

    // Perform additional content-specific checks if needed
    if (response.granted && contentGate.enforceServerSide) {
      // Verify content exists and is active
      const contentValid = await this.verifyContentExists(
        contentGate.courseId,
        contentGate.moduleId,
      );

      if (!contentValid) {
        return {
          granted: false,
          reason: 'invalid',
          message: 'Content not found or inactive.',
        };
      }
    }

    return response;
  }

  /**
   * Batch validation for multiple resources
   */
  public async validateBatchAccess(
    userId: string,
    resources: Array<{ id: string; tier: Tier }>,
  ): Promise<Map<string, AccessResponse>> {
    const results = new Map<string, AccessResponse>();

    // Get user's tier once
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      // Return denied for all resources
      resources.forEach((resource) => {
        results.set(resource.id, {
          granted: false,
          reason: 'invalid',
        });
      });
      return results;
    }

    // Check each resource
    resources.forEach((resource) => {
      const hasAccess = this.checkTierAccess(
        subscription.plan_id,
        resource.tier,
      );
      results.set(resource.id, {
        granted: hasAccess,
        reason: hasAccess ? 'authenticated' : 'tier_mismatch',
        userTier: subscription.plan_id,
        upgradeRequired: hasAccess ? undefined : resource.tier,
      });
    });

    return results;
  }

  /**
   * Logs access attempts for security monitoring
   */
  private async logAccessAttempt(
    request: AccessRequest,
    granted: boolean,
    reason?: string,
  ): Promise<void> {
    try {
      // Get user's current tier for logging
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', request.userId)
        .single();

      const attempt: Omit<AccessAttempt, 'id' | 'timestamp'> = {
        user_id: request.userId,
        resource_type: request.resourceType,
        resource_id: request.resourceId,
        required_tier: request.requiredTier,
        user_tier: profile?.tier || 'free',
        access_granted: granted,
        denial_reason: reason,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        suspicious: this.isAttemptSuspicious(request, granted),
      };

      // Log to database
      await supabase.from('access_attempts').insert(attempt);

      // Log to security logger
      SecurityLogger.log(
        'access_attempt',
        attempt,
        granted ? 'info' : 'warning',
      );
    } catch (error) {
      // Don't fail the access check if logging fails
      console.error('Failed to log access attempt:', error);
    }
  }

  /**
   * Detects suspicious access patterns
   */
  private isAttemptSuspicious(
    request: AccessRequest,
    granted: boolean,
  ): boolean {
    // Check for patterns like:
    // - Multiple failed attempts in short time
    // - Attempting to access high-tier content repeatedly without subscription
    // - Unusual access patterns

    const attempts = this.attemptCounter.get(request.userId) || [];
    const recentAttempts = attempts.filter(
      (timestamp) => Date.now() - timestamp < 60000,
    );

    // Suspicious if more than 10 failed attempts in a minute
    if (!granted && recentAttempts.length > 10) {
      return true;
    }

    // Suspicious if trying to access expert content more than 5 times without access
    if (
      !granted &&
      request.requiredTier === 'expert' &&
      recentAttempts.length > 5
    ) {
      return true;
    }

    return false;
  }

  /**
   * Rate limiting check
   */
  private isRateLimited(userId: string): boolean {
    const attempts = this.attemptCounter.get(userId) || [];
    const now = Date.now();

    // Clean old attempts
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < 60000,
    );
    this.attemptCounter.set(userId, recentAttempts);

    // Add current attempt
    recentAttempts.push(now);

    return recentAttempts.length > this.MAX_ATTEMPTS_PER_MINUTE;
  }

  /**
   * Cache management
   */
  private getCachedAccess(request: AccessRequest): AccessResponse | null {
    const key = this.getCacheKey(request);
    const cached = this.accessCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    return null;
  }

  private cacheAccessResult(
    request: AccessRequest,
    response: AccessResponse,
  ): void {
    const key = this.getCacheKey(request);
    this.accessCache.set(key, {
      result: response,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    this.cleanCache();
  }

  private getCacheKey(request: AccessRequest): string {
    return `${request.userId}:${request.resourceType}:${request.resourceId}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.accessCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.accessCache.delete(key);
      }
    }
  }

  /**
   * Utility methods
   */
  private async verifyContentExists(
    courseId: string,
    moduleId?: string,
  ): Promise<boolean> {
    // This would check against your content database
    // For now, return true as placeholder
    return true;
  }

  private getClientIP(): string {
    // In production, get from request headers
    return 'unknown';
  }

  private getUserAgent(): string {
    // In production, get from request headers
    return typeof window !== 'undefined'
      ? window.navigator.userAgent
      : 'unknown';
  }

  /**
   * Clear cache for a specific user (useful after subscription changes)
   */
  public clearUserCache(userId: string): void {
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.accessCache.delete(key);
      }
    }
  }
}

// ========================================================================
// Export singleton instance
// ========================================================================

export const accessManager = AccessManager.getInstance();
