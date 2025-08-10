# Access Control Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the course access control feature in the AI for Elders platform. The testing approach ensures robust validation of both client-side and server-side access controls.

## Test Scenarios

### 1. Authentication Tests

#### 1.1 Unauthenticated User Access
```typescript
describe('Unauthenticated User Access', () => {
  test('should deny access to all paid content', async () => {
    // Test accessing advanced course without auth
    const response = await accessManager.validateAccess({
      userId: null,
      resourceType: 'course',
      resourceId: 'ai-assistant',
      requiredTier: 'advanced'
    });
    
    expect(response.granted).toBe(false);
    expect(response.reason).toBe('invalid');
  });
  
  test('should show authentication prompt', () => {
    render(<ProtectedContent courseId="ai-assistant" requiredTier="advanced">
      <CourseContent />
    </ProtectedContent>);
    
    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
  });
});
```

### 2. Tier-Based Access Tests

#### 2.1 Free Tier User
```typescript
describe('Free Tier User Access', () => {
  beforeEach(() => {
    mockUser({ tier: 'free', status: 'active' });
  });
  
  test('should allow access to free content', async () => {
    const response = await validateAccess('ai-basics', 'free');
    expect(response.granted).toBe(true);
  });
  
  test('should deny access to advanced content', async () => {
    const response = await validateAccess('ai-assistant', 'advanced');
    expect(response.granted).toBe(false);
    expect(response.upgradeRequired).toBe('advanced');
  });
  
  test('should deny access to expert content', async () => {
    const response = await validateAccess('advanced-ai', 'expert');
    expect(response.granted).toBe(false);
    expect(response.upgradeRequired).toBe('expert');
  });
});
```

#### 2.2 Advanced Tier User
```typescript
describe('Advanced Tier User Access', () => {
  beforeEach(() => {
    mockUser({ tier: 'advanced', status: 'active' });
  });
  
  test('should allow access to free and advanced content', async () => {
    const freeAccess = await validateAccess('ai-basics', 'free');
    const advancedAccess = await validateAccess('ai-assistant', 'advanced');
    
    expect(freeAccess.granted).toBe(true);
    expect(advancedAccess.granted).toBe(true);
  });
  
  test('should deny access to expert content', async () => {
    const response = await validateAccess('advanced-ai', 'expert');
    expect(response.granted).toBe(false);
    expect(response.upgradeRequired).toBe('expert');
  });
});
```

#### 2.3 Expert Tier User
```typescript
describe('Expert Tier User Access', () => {
  beforeEach(() => {
    mockUser({ tier: 'expert', status: 'active' });
  });
  
  test('should allow access to all content', async () => {
    const freeAccess = await validateAccess('ai-basics', 'free');
    const advancedAccess = await validateAccess('ai-assistant', 'advanced');
    const expertAccess = await validateAccess('advanced-ai', 'expert');
    
    expect(freeAccess.granted).toBe(true);
    expect(advancedAccess.granted).toBe(true);
    expect(expertAccess.granted).toBe(true);
  });
});
```

### 3. Subscription Status Tests

#### 3.1 Expired Subscription
```typescript
describe('Expired Subscription', () => {
  beforeEach(() => {
    mockUser({ 
      tier: 'advanced', 
      status: 'expired',
      endDate: '2024-01-01'
    });
  });
  
  test('should downgrade to free tier access', async () => {
    const freeAccess = await validateAccess('ai-basics', 'free');
    const advancedAccess = await validateAccess('ai-assistant', 'advanced');
    
    expect(freeAccess.granted).toBe(true);
    expect(advancedAccess.granted).toBe(false);
    expect(advancedAccess.reason).toBe('expired');
  });
});
```

#### 3.2 Grace Period
```typescript
describe('Grace Period', () => {
  test('should maintain access during grace period', async () => {
    mockUser({ 
      tier: 'advanced', 
      status: 'grace_period',
      gracePeriodEnd: getFutureDate(3) // 3 days from now
    });
    
    const response = await validateAccess('ai-assistant', 'advanced');
    expect(response.granted).toBe(true);
  });
  
  test('should deny access after grace period', async () => {
    mockUser({ 
      tier: 'advanced', 
      status: 'grace_period',
      gracePeriodEnd: getPastDate(1) // 1 day ago
    });
    
    const response = await validateAccess('ai-assistant', 'advanced');
    expect(response.granted).toBe(false);
    expect(response.reason).toBe('grace_period_ended');
  });
});
```

#### 3.3 Trial Period
```typescript
describe('Trial Period', () => {
  test('should grant full access during trial', async () => {
    mockUser({ 
      tier: 'expert', 
      status: 'trial',
      trialEndDate: getFutureDate(7)
    });
    
    const response = await validateAccess('advanced-ai', 'expert');
    expect(response.granted).toBe(true);
  });
});
```

### 4. Server-Side Validation Tests

#### 4.1 Edge Function Tests
```typescript
describe('Supabase Edge Function - validate-access', () => {
  test('should validate JWT token', async () => {
    const response = await fetch('/functions/v1/validate-access', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({
        resourceType: 'course',
        resourceId: 'ai-assistant',
        requiredTier: 'advanced'
      })
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.reason).toBe('invalid_token');
  });
  
  test('should check subscription in database', async () => {
    const validToken = await getValidUserToken();
    
    const response = await fetch('/functions/v1/validate-access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        resourceType: 'course',
        resourceId: 'ai-assistant',
        requiredTier: 'advanced'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.granted).toBeDefined();
  });
});
```

### 5. Cache and Performance Tests

#### 5.1 Cache Behavior
```typescript
describe('Access Cache', () => {
  test('should cache successful validations', async () => {
    const spy = jest.spyOn(accessManager, 'performServerValidation');
    
    // First call - should hit server
    await accessManager.validateAccess(request);
    expect(spy).toHaveBeenCalledTimes(1);
    
    // Second call within TTL - should use cache
    await accessManager.validateAccess(request);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  
  test('should invalidate cache on subscription change', async () => {
    await accessManager.validateAccess(request);
    
    // Change subscription
    updateUserSubscription({ tier: 'expert' });
    
    // Cache should be cleared
    const spy = jest.spyOn(accessManager, 'performServerValidation');
    await accessManager.validateAccess(request);
    expect(spy).toHaveBeenCalled();
  });
});
```

### 6. Security Tests

#### 6.1 Rate Limiting
```typescript
describe('Rate Limiting', () => {
  test('should block excessive access attempts', async () => {
    const requests = Array(101).fill(null).map(() => 
      accessManager.validateAccess(request)
    );
    
    const responses = await Promise.all(requests);
    const blocked = responses.filter(r => r.reason === 'invalid');
    
    expect(blocked.length).toBeGreaterThan(0);
  });
});
```

#### 6.2 Suspicious Activity Detection
```typescript
describe('Suspicious Activity', () => {
  test('should flag multiple failed attempts', async () => {
    const userId = 'test-user';
    
    // Simulate multiple failed attempts
    for (let i = 0; i < 15; i++) {
      await accessManager.validateAccess({
        userId,
        resourceType: 'course',
        resourceId: `course-${i}`,
        requiredTier: 'expert'
      });
    }
    
    // Check if flagged as suspicious
    const { data } = await supabase
      .from('access_attempts')
      .select('suspicious')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    expect(data.suspicious).toBe(true);
  });
});
```

### 7. UI Component Tests

#### 7.1 ProtectedContent Component
```typescript
describe('ProtectedContent Component', () => {
  test('should show loading state during validation', () => {
    render(
      <ProtectedContent 
        courseId="ai-assistant" 
        requiredTier="advanced"
        enforceServerSide={true}
      >
        <CourseContent />
      </ProtectedContent>
    );
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
  
  test('should show upgrade prompt for insufficient tier', async () => {
    mockUser({ tier: 'free' });
    
    render(
      <ProtectedContent 
        courseId="ai-assistant" 
        requiredTier="advanced"
      >
        <CourseContent />
      </ProtectedContent>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Upgrade to Advanced')).toBeInTheDocument();
      expect(screen.getByText('$1.99/month')).toBeInTheDocument();
    });
  });
});
```

### 8. Integration Tests

#### 8.1 End-to-End User Journey
```typescript
describe('E2E User Journey', () => {
  test('complete upgrade flow', async () => {
    // Start as free user
    await loginAs('free-user@test.com');
    
    // Try to access advanced content
    await navigateTo('/courses/ai-assistant');
    
    // Should see upgrade prompt
    expect(await page.textContent('h1')).toContain('Upgrade to Advanced');
    
    // Click upgrade
    await page.click('button:has-text("Upgrade to Advanced")');
    
    // Complete Stripe checkout
    await completeStripeCheckout();
    
    // Should now have access
    await navigateTo('/courses/ai-assistant');
    expect(await page.textContent('h1')).toContain('AI as Your Personal Assistant');
  });
});
```

## Test Data Setup

```typescript
// Test utilities
export const mockUsers = {
  freeUser: {
    id: 'user-free',
    email: 'free@test.com',
    tier: 'free',
    subscription: { planId: 'free', status: 'active' }
  },
  advancedUser: {
    id: 'user-advanced',
    email: 'advanced@test.com',
    tier: 'advanced',
    subscription: { planId: 'advanced', status: 'active' }
  },
  expertUser: {
    id: 'user-expert',
    email: 'expert@test.com',
    tier: 'expert',
    subscription: { planId: 'expert', status: 'active' }
  },
  expiredUser: {
    id: 'user-expired',
    email: 'expired@test.com',
    tier: 'advanced',
    subscription: { planId: 'advanced', status: 'expired' }
  }
};

// Mock Supabase responses
export function mockSupabaseAuth(user: typeof mockUsers.freeUser) {
  jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
    data: { user },
    error: null
  });
}

export function mockSupabaseSubscription(subscription: any) {
  jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: subscription, error: null })
          })
        })
      };
    }
    return originalFrom(table);
  });
}
```

## Performance Benchmarks

### Target Metrics
- Client-side validation: < 10ms
- Server-side validation (cached): < 50ms  
- Server-side validation (uncached): < 200ms
- Batch validation (10 resources): < 300ms

### Load Testing
```typescript
describe('Performance', () => {
  test('should handle 100 concurrent validations', async () => {
    const start = Date.now();
    
    const validations = Array(100).fill(null).map((_, i) => 
      accessManager.validateAccess({
        userId: `user-${i}`,
        resourceType: 'course',
        resourceId: 'ai-basics',
        requiredTier: 'free'
      })
    );
    
    await Promise.all(validations);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## Security Testing Checklist

- [ ] SQL injection prevention in database queries
- [ ] XSS protection in error messages
- [ ] CSRF token validation
- [ ] Rate limiting enforcement
- [ ] JWT token validation
- [ ] Session timeout handling
- [ ] Suspicious activity detection
- [ ] Audit logging completeness
- [ ] Error message sanitization
- [ ] Input validation on all endpoints

## Monitoring and Alerts

### Key Metrics to Track
1. Failed access attempts per user
2. Upgrade conversion rate from access denial
3. Cache hit ratio
4. Server validation response times
5. Suspicious activity patterns

### Alert Thresholds
- > 10 failed attempts per user in 5 minutes
- > 100 total failed attempts in 1 minute
- Server validation time > 500ms
- Cache hit ratio < 80%
- Any critical security events