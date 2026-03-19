import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found');
}

export const stripePromise = loadStripe(stripePublishableKey || '');

// Price IDs from Stripe Dashboard
// TODO: Replace with actual price IDs after creating products in Stripe
export const PRICE_IDS = {
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '',
  PRO_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || '',
};

export const PRICES = {
  PRO_MONTHLY: {
    amount: 8.99,
    currency: 'USD',
    interval: 'month',
    label: 'Pro Monthly',
  },
  PRO_ANNUAL: {
    amount: 59.99,
    currency: 'USD',
    interval: 'year',
    label: 'Pro Annual',
    savings: '44%',
  },
};
