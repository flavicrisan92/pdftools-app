import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

// Define secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// Create Stripe Checkout Session
export const createCheckoutSession = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onRequest(async (req, res) => {
    // Handle CORS preflight
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

      if (!priceId || !userId || !successUrl || !cancelUrl) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value());

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        metadata: {
          userId: userId,
        },
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

// Stripe Webhook to handle subscription events
export const stripeWebhook = functions
  .runWith({ secrets: [stripeSecretKey, stripeWebhookSecret] })
  .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const stripe = new Stripe(stripeSecretKey.value());

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }

    const db = admin.firestore();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          await db.collection('users').doc(userId).set(
            {
              plan: 'pro',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`User ${userId} upgraded to pro`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          await db.collection('users').doc(userId).set(
            {
              plan: isActive ? 'pro' : 'free',
              subscriptionStatus: subscription.status,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`User ${userId} subscription status: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db.collection('users').doc(userId).set(
            {
              plan: 'free',
              subscriptionStatus: 'canceled',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`User ${userId} subscription canceled`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  });
