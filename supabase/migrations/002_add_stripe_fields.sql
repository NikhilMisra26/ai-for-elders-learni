-- Add Stripe fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_status text;

-- Add Stripe fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add Stripe fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS stripe_invoice_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON public.invoices(stripe_invoice_id);

-- Update RLS policies to check subscription status for premium content
-- This ensures only paid users can access premium content
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid, required_tier text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.subscriptions s ON s.user_id = p.id
    WHERE p.id = user_id
    AND s.status = 'active'
    AND (
      (required_tier = 'advanced' AND s.plan_id IN ('advanced', 'expert')) OR
      (required_tier = 'expert' AND s.plan_id = 'expert') OR
      (required_tier = 'free')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update user tier based on subscription changes
CREATE OR REPLACE FUNCTION public.update_user_tier_from_subscription()
RETURNS trigger AS $$
BEGIN
  -- Update the user's tier in profiles when subscription changes
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET tier = NEW.plan_id
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE public.profiles
    SET tier = 'free'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_tier_on_subscription_change ON public.subscriptions;
CREATE TRIGGER update_tier_on_subscription_change
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_tier_from_subscription();

-- Add RLS policy for premium content protection
-- Example: Protect course progress for premium courses
CREATE POLICY "Premium courses require active subscription" ON public.course_progress
FOR ALL USING (
  auth.uid() = user_id AND (
    course_id = 'free' OR
    has_active_subscription(auth.uid(), 
      CASE 
        WHEN course_id = 'advanced' THEN 'advanced'
        WHEN course_id = 'expert' THEN 'expert'
        ELSE 'free'
      END
    )
  )
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN public.profiles.stripe_subscription_status IS 'Current Stripe subscription status';
COMMENT ON FUNCTION public.has_active_subscription IS 'Check if user has active subscription for required tier';