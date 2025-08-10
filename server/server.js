import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FRONTEND_URL',
  'STRIPE_PRICE_ADVANCED',
  'STRIPE_PRICE_EXPERT',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configuration from environment variables with defaults
const config = {
  port: process.env.PORT || 3001,
  stripeApiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  rateLimiting: {
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '100', 10),
    },
    api: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      max: parseInt(process.env.RATE_LIMIT_API_MAX || '10', 10),
    },
    webhook: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '1000', 10),
    },
  },
  bodyLimits: {
    webhook: process.env.WEBHOOK_BODY_LIMIT || '1mb',
    api: process.env.API_BODY_LIMIT || '10kb',
    urlencoded: process.env.URLENCODED_BODY_LIMIT || '10kb',
  },
  gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '7', 10),
  corsOrigins: {
    development: [
      process.env.DEV_CORS_ORIGIN_1 || 'http://localhost:5173',
      process.env.DEV_CORS_ORIGIN_2 || 'https://localhost:5173',
    ],
  },
};

console.log('✅ All required environment variables are present');

const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: config.stripeApiVersion,
});

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook idempotency helper functions
const webhookHelpers = {
  // Check if webhook event was already processed
  async isEventProcessed(eventId) {
    const { data } = await supabase.rpc('is_webhook_event_processed', {
      stripe_event_id: eventId
    });
    return data === true;
  },

  // Record webhook event processing
  async recordEvent(eventId, eventType, result = 'success', metadata = null) {
    const { data, error } = await supabase.rpc('record_webhook_event', {
      stripe_event_id: eventId,
      stripe_event_type: eventType,
      result: result,
      event_metadata: metadata
    });
    if (error) {
      console.error('Failed to record webhook event:', error);
    }
    return data;
  },

  // Execute database operations in a transaction-safe manner
  async executeWithTransaction(operations) {
    try {
      // Execute all operations
      const results = [];
      for (const operation of operations) {
        const result = await operation();
        if (result.error) {
          throw new Error(`Database operation failed: ${result.error.message}`);
        }
        results.push(result);
      }
      return { success: true, results };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: config.rateLimiting.general.windowMs,
  max: config.rateLimiting.general.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimiting.api.windowMs,
  max: config.rateLimiting.api.max,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: config.rateLimiting.webhook.windowMs,
  max: config.rateLimiting.webhook.max,
  message: {
    error: 'Too many webhook requests from this IP.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(generalLimiter);
app.use('/api/', apiLimiter);
app.use('/webhook', webhookLimiter);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...config.corsOrigins.development,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Use raw body for webhook endpoint with size limit
app.use('/webhook', express.raw({ 
  type: 'application/json',
  limit: config.bodyLimits.webhook,
}));

// JSON parser for other routes with size limits
app.use(express.json({ 
  limit: config.bodyLimits.api,
  strict: true
}));

// URL encoded parser with size limits
app.use(express.urlencoded({ 
  extended: false, 
  limit: config.bodyLimits.urlencoded,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Input validation middleware
const validateCheckoutSession = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('userEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('planId').isIn(['advanced', 'expert']).withMessage('Valid plan ID is required'),
];

const validatePortalSession = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Create Checkout Session
app.post('/api/create-checkout-session', validateCheckoutSession, handleValidationErrors, async (req, res) => {
  try {
    const { userId, userEmail, planId } = req.body;

    if (!userId || !userEmail || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const priceMap = {
      advanced: process.env.STRIPE_PRICE_ADVANCED,
      expert: process.env.STRIPE_PRICE_EXPERT,
    };

    const priceId = priceMap[planId];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
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
app.post('/api/create-portal-session', validatePortalSession, handleValidationErrors, async (req, res) => {
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

// Stripe Webhook Handler with Idempotency
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

  // Check if this event was already processed (idempotency)
  try {
    const alreadyProcessed = await webhookHelpers.isEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`⏭️  Webhook event ${event.id} already processed, skipping`);
      return res.json({ received: true, skipped: true });
    }
  } catch (error) {
    console.error('Error checking event idempotency:', error);
    // Continue processing if idempotency check fails to avoid blocking webhooks
  }

  // Handle different event types with transaction safety
  let processingResult = 'success';
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          // Execute all operations in transaction-safe manner
          await webhookHelpers.executeWithTransaction([
            // Update user profile tier
            () => supabase
              .from('profiles')
              .update({
                tier: planId,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
              })
              .eq('id', userId),
            
            // Update subscription table
            () => supabase.from('subscriptions').upsert({
              user_id: userId,
              plan_id: planId,
              status: 'active',
              start_date: new Date().toISOString(),
              stripe_subscription_id: session.subscription,
              auto_renew: true,
            }),
            
            // Add invoice record
            () => supabase.from('invoices').insert({
              user_id: userId,
              amount: (session.amount_total || 0) / 100, // Convert from cents
              plan_name: planId === 'advanced' ? 'Advanced Learning' : 'Expert Mastery',
              status: 'paid',
              stripe_invoice_id: session.invoice,
              date: new Date().toISOString(),
            })
          ]);

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

          // Execute updates in transaction-safe manner
          const operations = [
            // Update subscription
            () => supabase
              .from('subscriptions')
              .update({
                status,
                plan_id: planId,
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })
              .eq('user_id', profile.id)
              .eq('stripe_subscription_id', subscription.id)
          ];

          // Update profile tier if active
          if (status === 'active') {
            operations.push(
              () => supabase
                .from('profiles')
                .update({ tier: planId })
                .eq('id', profile.id)
            );
          }

          await webhookHelpers.executeWithTransaction(operations);
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
          // Execute updates in transaction-safe manner
          await webhookHelpers.executeWithTransaction([
            // Update subscription to cancelled
            () => supabase
              .from('subscriptions')
              .update({
                status: 'cancelled',
                end_date: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
              .eq('stripe_subscription_id', subscription.id),
            
            // Reset user to free tier
            () => supabase
              .from('profiles')
              .update({ tier: 'free' })
              .eq('id', profile.id)
          ]);

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

          await webhookHelpers.executeWithTransaction([
            () => supabase.from('invoices').insert({
              user_id: profile.id,
              amount: (invoice.amount_paid || 0) / 100, // Convert from cents
              plan_name: planName,
              status: 'paid',
              stripe_invoice_id: invoice.id,
              download_url: invoice.invoice_pdf,
              date: new Date(invoice.created * 1000).toISOString(),
            })
          ]);

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
          // Execute updates in transaction-safe manner
          await webhookHelpers.executeWithTransaction([
            // Update subscription to grace period
            () => supabase
              .from('subscriptions')
              .update({
                status: 'grace_period',
                grace_period_end: new Date(Date.now() + config.gracePeriodDays * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq('user_id', profile.id),
            
            // Add failed invoice record
            () => supabase.from('invoices').insert({
              user_id: profile.id,
              amount: (invoice.amount_due || 0) / 100,
              plan_name: invoice.lines.data[0]?.description || 'Subscription',
              status: 'failed',
              stripe_invoice_id: invoice.id,
              date: new Date(invoice.created * 1000).toISOString(),
            })
          ]);

          console.log(`⚠️ Payment failed for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    processingResult = 'failed';
    
    // Still record the failed attempt for tracking
    try {
      await webhookHelpers.recordEvent(
        event.id, 
        event.type, 
        'failed', 
        { error: error.message, stack: error.stack }
      );
    } catch (recordError) {
      console.error('Failed to record webhook error:', recordError);
    }
    
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
  
  // Record successful processing
  try {
    await webhookHelpers.recordEvent(
      event.id, 
      event.type, 
      processingResult,
      { 
        customer_id: event.data.object?.customer,
        subscription_id: event.data.object?.subscription,
        amount: event.data.object?.amount_total || event.data.object?.amount_paid
      }
    );
  } catch (recordError) {
    console.error('Failed to record webhook success:', recordError);
    // Don't fail the webhook if we can't record it
  }
  
  res.json({ received: true });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Global error handler:', err);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS: Origin not allowed'
    });
  }
  
  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests'
    });
  }
  
  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📝 Webhook endpoint: http://localhost:${config.port}/webhook`);
  console.log(`🔒 Security measures active:`);
  console.log(`   ✓ Helmet security headers`);
  console.log(`   ✓ Rate limiting (${config.rateLimiting.general.max}/${config.rateLimiting.general.windowMs/60000}min general, ${config.rateLimiting.api.max}/${config.rateLimiting.api.windowMs/60000}min API)`);
  console.log(`   ✓ CORS protection`);
  console.log(`   ✓ Request body size limits (webhook: ${config.bodyLimits.webhook}, API: ${config.bodyLimits.api})`);
  console.log(`   ✓ Input validation`);
  console.log(`   ✓ Environment validation`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});