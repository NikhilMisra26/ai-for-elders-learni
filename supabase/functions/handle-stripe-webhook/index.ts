import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret,
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          // Update user profile tier
          await supabaseClient
            .from('profiles')
            .update({
              tier: planId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId);

          // Update subscription table
          await supabaseClient.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            start_date: new Date().toISOString(),
            stripe_subscription_id: session.subscription,
            auto_renew: true,
          });

          // Add invoice record
          await supabaseClient.from('invoices').insert({
            user_id: userId,
            amount: (session.amount_total || 0) / 100, // Convert from cents
            plan_name:
              planId === 'advanced' ? 'Advanced Learning' : 'Expert Mastery',
            status: 'paid',
            stripe_invoice_id: session.invoice,
            date: new Date().toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const status =
            subscription.status === 'active'
              ? 'active'
              : subscription.status === 'canceled'
                ? 'cancelled'
                : 'expired';

          // Determine plan from price
          const priceId = subscription.items.data[0]?.price.id;
          let planId: 'advanced' | 'expert' | 'free' = 'free';

          if (priceId === 'price_advanced_monthly') {
            planId = 'advanced';
          } else if (priceId === 'price_expert_monthly') {
            planId = 'expert';
          }

          // Update subscription
          await supabaseClient
            .from('subscriptions')
            .update({
              status,
              plan_id: planId,
              next_billing_date: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('user_id', profile.id)
            .eq('stripe_subscription_id', subscription.id);

          // Update profile tier if active
          if (status === 'active') {
            await supabaseClient
              .from('profiles')
              .update({ tier: planId })
              .eq('id', profile.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Update subscription to cancelled
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              end_date: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
            .eq('stripe_subscription_id', subscription.id);

          // Reset user to free tier
          await supabaseClient
            .from('profiles')
            .update({ tier: 'free' })
            .eq('id', profile.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get user by customer ID
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile && invoice.subscription) {
          // Add invoice record
          const lineItem = invoice.lines.data[0];
          const planName = lineItem?.description || 'Subscription';

          await supabaseClient.from('invoices').insert({
            user_id: profile.id,
            amount: (invoice.amount_paid || 0) / 100, // Convert from cents
            plan_name: planName,
            status: 'paid',
            stripe_invoice_id: invoice.id,
            download_url: invoice.invoice_pdf,
            date: new Date(invoice.created * 1000).toISOString(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get user by customer ID
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Update subscription to grace period
          await supabaseClient
            .from('subscriptions')
            .update({
              status: 'grace_period',
              grace_period_end: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days
            })
            .eq('user_id', profile.id);

          // Add failed invoice record
          await supabaseClient.from('invoices').insert({
            user_id: profile.id,
            amount: (invoice.amount_due || 0) / 100,
            plan_name: invoice.lines.data[0]?.description || 'Subscription',
            status: 'failed',
            stripe_invoice_id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
