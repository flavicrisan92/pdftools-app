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

// Fallback prices (used while loading)
export const PRICES = {
  PRO_MONTHLY: {
    amount: 0,
    currency: 'USD',
    interval: 'month',
    label: 'Pro Monthly',
  },
  PRO_ANNUAL: {
    amount: 0,
    currency: 'USD',
    interval: 'year',
    label: 'Pro Annual',
    savings: '',
  },
};

export interface StripePrice {
  id: string;
  productId: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
}

export async function fetchStripePrices(): Promise<StripePrice[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/getPrices`
      : '/api/get-prices';

    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}
