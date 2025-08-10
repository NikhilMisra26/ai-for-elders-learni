import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Use raw body for webhook endpoint
app.use('/webhook', express.raw({ type: 'application/json' }));

// JSON parser for other routes
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, userEmail, planId } = req.body;

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create new Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session - NO FREE TRIAL
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/account`,
      metadata: {
        supabase_user_id: userId,
        planId: planId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          planId: planId,
        },
        // NO trial_period_days - users must pay immediately
      },
      allow_promotion_codes: true,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found for this user' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook Handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          // Update user profile tier
          await supabase
            .from('profiles')
            .update({
              tier: planId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId);

          // Update subscription table
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            start_date: new Date().toISOString(),
            stripe_subscription_id: session.subscription,
            auto_renew: true,
          });

          // Add invoice record
          await supabase.from('invoices').insert({
            user_id: userId,
            amount: (session.amount_total || 0) / 100, // Convert from cents
            plan_name: planId === 'advanced' ? 'Advanced Learning' : 'Expert Mastery',
            status: 'paid',
            stripe_invoice_id: session.invoice,
            date: new Date().toISOString(),
          });

          console.log(`✅ User ${userId} upgraded to ${planId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Get user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'canceled' ? 'cancelled' :
                        'expired';

          // Determine plan from price
          const priceId = subscription.items.data[0]?.price.id;
          let planId = 'free';

          // Update these with your actual price IDs
          if (priceId === process.env.STRIPE_PRICE_ADVANCED) {
            planId = 'advanced';
          } else if (priceId === process.env.STRIPE_PRICE_EXPERT) {
            planId = 'expert';
          }

          // Update subscription
          await supabase
            .from('subscriptions')
            .update({
              status,
              plan_id: planId,
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('user_id', profile.id)
            .eq('stripe_subscription_id', subscription.id);

          // Update profile tier if active
          if (status === 'active') {
            await supabase
              .from('profiles')
              .update({ tier: planId })
              .eq('id', profile.id);
          }

          console.log(`📝 Subscription updated for user ${profile.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Get user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Update subscription to cancelled
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              end_date: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
            .eq('stripe_subscription_id', subscription.id);

          // Reset user to free tier
          await supabase
            .from('profiles')
            .update({ tier: 'free' })
            .eq('id', profile.id);

          console.log(`❌ Subscription cancelled for user ${profile.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Get user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile && invoice.subscription) {
          // Add invoice record
          const lineItem = invoice.lines.data[0];
          const planName = lineItem?.description || 'Subscription';

          await supabase.from('invoices').insert({
            user_id: profile.id,
            amount: (invoice.amount_paid || 0) / 100, // Convert from cents
            plan_name: planName,
            status: 'paid',
            stripe_invoice_id: invoice.id,
            download_url: invoice.invoice_pdf,
            date: new Date(invoice.created * 1000).toISOString(),
          });

          console.log(`💰 Payment succeeded for user ${profile.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Get user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Update subscription to grace period
          await supabase
            .from('subscriptions')
            .update({
              status: 'grace_period',
              grace_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .eq('user_id', profile.id);

          // Add failed invoice record
          await supabase.from('invoices').insert({
            user_id: profile.id,
            amount: (invoice.amount_due || 0) / 100,
            plan_name: invoice.lines.data[0]?.description || 'Subscription',
            status: 'failed',
            stripe_invoice_id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
          });

          console.log(`⚠️ Payment failed for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Webhook endpoint: http://localhost:${PORT}/webhook`);
});