import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { PRICES, PRICE_IDS } from '../lib/stripe';

type PlanType = 'free' | 'monthly' | 'annual';

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  priceId?: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '3 operations per day',
      'Max 10MB file size',
      'Basic compression',
      'Watermark on output',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: `$${PRICES.PRO_MONTHLY.amount}`,
    period: '/month',
    priceId: PRICE_IDS.PRO_MONTHLY,
    features: [
      'Unlimited operations',
      'Max 100MB file size',
      'Advanced compression',
      'No watermark',
      'Priority processing',
    ],
    cta: 'Get Pro',
    popular: true,
  },
  {
    id: 'annual',
    name: 'Pro Annual',
    price: `$${PRICES.PRO_ANNUAL.amount}`,
    period: '/year',
    priceId: PRICE_IDS.PRO_ANNUAL,
    features: [
      'Everything in Pro Monthly',
      `Save ${PRICES.PRO_ANNUAL.savings} vs monthly`,
      'Priority support',
    ],
    cta: 'Get Pro',
    popular: false,
  },
];

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === 'free') {
      navigate('/');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/pricing', selectedPlan: plan.id } });
      return;
    }

    if (!plan.priceId) {
      console.error('No price ID for plan:', plan.id);
      return;
    }

    setLoadingPlan(plan.id);

    try {
      // Call Firebase Cloud Function to create Stripe Checkout Session
      // When VITE_API_URL is set (local), call function directly; otherwise use hosting rewrite
      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/createCheckoutSession`
        : '/api/create-checkout-session';

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: plan.priceId,
            userId: user.uid,
            userEmail: user.email,
            successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/pricing`,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        alert('Unable to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600">
          Start free, upgrade when you need more
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-2xl border-2 p-8 ${
              plan.popular
                ? 'border-primary-500 shadow-lg scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="bg-primary-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? 'primary' : 'outline'}
              className="w-full"
              size="lg"
              onClick={() => handleSelectPlan(plan)}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                plan.cta
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="max-w-2xl mx-auto text-left space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900">Is my data secure?</h3>
            <p className="text-gray-600 mt-1">
              Yes! All PDF processing happens directly in your browser. Your files never leave your device.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Can I cancel anytime?</h3>
            <p className="text-gray-600 mt-1">
              Absolutely. Cancel your subscription anytime with no questions asked.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Do you offer refunds?</h3>
            <p className="text-gray-600 mt-1">
              Yes, we offer a 30-day money-back guarantee for all paid plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
