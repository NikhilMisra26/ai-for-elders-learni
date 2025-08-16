-- ============================================================================
-- Seed Data for Support Ticket System
-- Description: Test data for development and testing of support ticket functionality
-- Note: This assumes you have existing users in auth.users table
-- ============================================================================

-- First, ensure we have some test users (if not already present)
-- These would normally come from your main seed.sql file

-- Function to safely create test support tickets
CREATE OR REPLACE FUNCTION seed_support_tickets()
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_admin_id UUID;
    v_ticket_id UUID;
BEGIN
    -- Get a sample user ID (you should replace this with actual test user IDs)
    SELECT id INTO v_user_id 
    FROM auth.users 
    LIMIT 1;
    
    -- Only proceed if we have users
    IF v_user_id IS NOT NULL THEN
        
        -- Create sample tickets with different statuses and priorities
        
        -- Ticket 1: Pending urgent billing issue
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            created_at
        ) VALUES (
            v_user_id,
            'I was charged twice for my subscription this month. I have the Advanced plan ($1.99) but my credit card shows two charges. Please help me resolve this issue and process a refund for the duplicate charge.',
            'pending',
            'urgent',
            'billing',
            'test.user1@example.com',
            'John Smith',
            'advanced',
            NOW() - INTERVAL '2 hours'
        );
        
        -- Ticket 2: In progress technical issue
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'The AI Chat Assistant course is not loading properly. When I click on Module 3, the page goes blank and I have to refresh. This has been happening for the past two days. I am using Chrome browser on Windows 10.',
            'in_progress',
            'high',
            'technical',
            'test.user2@example.com',
            'Mary Johnson',
            'expert',
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '6 hours'
        );
        
        -- Ticket 3: Resolved account issue
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            admin_response,
            created_at,
            responded_at,
            resolved_at
        ) VALUES (
            v_user_id,
            'I forgot my password and the reset email is not arriving. I have checked my spam folder but nothing is there. My email is correct. Please help me access my account.',
            'resolved',
            'normal',
            'account',
            'test.user3@example.com',
            'Robert Williams',
            'free',
            'We have manually sent a password reset link to your email address. Please check your inbox and follow the instructions. The link will expire in 1 hour. If you still do not receive it, please contact us again.',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
            NOW() - INTERVAL '3 days' + INTERVAL '3 hours'
        );
        
        -- Ticket 4: Closed course content feedback
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            admin_response,
            created_at,
            responded_at,
            resolved_at
        ) VALUES (
            v_user_id,
            'The Email Basics course is excellent! However, I noticed that the section about attachments could use more detail about file size limits and how to compress files. This would be very helpful for us beginners. Thank you for this wonderful platform!',
            'closed',
            'low',
            'course_content',
            'test.user4@example.com',
            'Patricia Davis',
            'advanced',
            'Thank you for your valuable feedback! We appreciate your suggestion about expanding the attachments section. We will include this in our next course update scheduled for next month. We are glad you are enjoying the platform!',
            NOW() - INTERVAL '1 week',
            NOW() - INTERVAL '1 week' + INTERVAL '1 day',
            NOW() - INTERVAL '1 week' + INTERVAL '1 day'
        );
        
        -- Ticket 5: Pending general inquiry
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            created_at
        ) VALUES (
            v_user_id,
            'I would like to know if you offer group discounts for senior centers. We have 15 members interested in taking your courses together. Can you provide information about bulk subscription options?',
            'pending',
            'normal',
            'general',
            'test.user5@example.com',
            'Michael Brown',
            'free',
            NOW() - INTERVAL '4 hours'
        );
        
        -- Ticket 6: High priority technical issue
        INSERT INTO public.support_tickets (
            user_id,
            message,
            status,
            priority,
            category,
            user_email,
            user_name,
            user_tier,
            created_at
        ) VALUES (
            v_user_id,
            'I cannot access any of my courses even though my subscription is active. When I try to open a course, it says I need to upgrade my plan, but I already have the Expert plan. This started happening after I changed my password yesterday.',
            'pending',
            'high',
            'technical',
            'test.user6@example.com',
            'Linda Martinez',
            'expert',
            NOW() - INTERVAL '30 minutes'
        );
        
        -- Add some rate limiting entries for testing
        -- These would simulate recent ticket creation attempts
        INSERT INTO public.rate_limiting_support (user_id, action_type, created_at)
        VALUES 
            (v_user_id, 'ticket_create', NOW() - INTERVAL '45 minutes'),
            (v_user_id, 'ticket_create', NOW() - INTERVAL '30 minutes'),
            (v_user_id, 'ticket_create', NOW() - INTERVAL '15 minutes');
        
        -- Add an old rate limiting entry that should be cleaned up
        INSERT INTO public.rate_limiting_support (user_id, action_type, created_at)
        VALUES (v_user_id, 'ticket_create', NOW() - INTERVAL '3 hours');
        
        RAISE NOTICE 'Support ticket seed data created successfully';
        
    ELSE
        RAISE NOTICE 'No users found. Please create users first before seeding support tickets.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the seed function
SELECT seed_support_tickets();

-- Clean up the temporary function
DROP FUNCTION IF EXISTS seed_support_tickets();

-- Display summary of seeded data
SELECT 
    status,
    priority,
    category,
    COUNT(*) as ticket_count
FROM public.support_tickets
GROUP BY status, priority, category
ORDER BY status, priority, category;

-- Display rate limiting entries
SELECT 
    COUNT(*) as rate_limit_entries,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM public.rate_limiting_support;