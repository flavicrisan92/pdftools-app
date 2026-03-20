import { useState, useEffect } from 'react';
import { Check, Loader2, Crown, Shield, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { PRICES, PRICE_IDS } from '../lib/stripe';
import type { SubscriptionType } from '../types/user';

type PlanType = 'free' | 'monthly' | 'annual';

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  originalPrice?: string;
  monthlyEquivalent?: string;
  period: string;
  priceId?: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular: boolean;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      { text: '3 operations per day', included: true },
      { text: 'Max 10MB file size', included: true },
      { text: 'Basic tools', included: true },
      { text: 'Unlimited operations', included: false },
      { text: '100MB file size', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Pro',
    price: `$${PRICES.PRO_MONTHLY.amount}`,
    period: '/month',
    priceId: PRICE_IDS.PRO_MONTHLY,
    features: [
      { text: 'Unlimited operations', included: true },
      { text: 'Max 100MB file size', included: true },
      { text: 'All PDF tools', included: true },
      { text: 'No watermarks', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Email support', included: true },
    ],
    cta: 'Get Pro Now',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'annual',
    name: 'Pro Annual',
    price: `$${PRICES.PRO_ANNUAL.amount}`,
    originalPrice: `$${(PRICES.PRO_MONTHLY.amount * 12).toFixed(0)}`,
    monthlyEquivalent: `$${(PRICES.PRO_ANNUAL.amount / 12).toFixed(2)}`,
    period: '/year',
    priceId: PRICE_IDS.PRO_ANNUAL,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: `Save ${PRICES.PRO_ANNUAL.savings}`, included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to features', included: true },
      { text: 'Dedicated assistance', included: true },
      { text: 'Best value', included: true },
    ],
    cta: 'Get Best Value',
    popular: false,
    badge: `Save ${PRICES.PRO_ANNUAL.savings}`,
  },
];

export function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>(null);
  const [checkingPlan, setCheckingPlan] = useState(true);

  useEffect(() => {
    async function checkPlan() {
      if (authLoading) return;

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserPlan(data.plan || 'free');
            setSubscriptionType(data.subscriptionType || null);
          } else {
            setUserPlan('free');
          }
        } catch (error) {
          console.error('Error checking plan:', error);
          setUserPlan('free');
        }
      } else {
        setUserPlan(null);
      }
      setCheckingPlan(false);
    }
    checkPlan();
  }, [user, authLoading]);

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
      });

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

  if (authLoading || checkingPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (userPlan === 'pro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-primary-500 to-purple-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Crown className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're a Pro Member!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Enjoy unlimited access to all PDF tools.
        </p>
        <p className="text-gray-500 mb-8">
          {subscriptionType === 'monthly'
            ? 'Monthly plan active. Switch to Annual to save 44%!'
            : subscriptionType === 'annual'
              ? 'Annual plan active. Thank you for your support!'
              : 'Thank you for being a Pro member!'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/account')} variant="primary" size="lg">
            Manage Subscription
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/')}>
            Go to Tools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Unlock Unlimited PDF Power
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of users who save hours every week with our Pro tools.
            No limits, no watermarks, just results.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              Instant access
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-primary-500 shadow-xl md:scale-105 md:-my-4 order-first md:order-none'
                  : plan.id === 'annual'
                    ? 'border border-gray-200 shadow-sm hover:shadow-md order-2 md:order-none'
                    : 'border border-gray-200 shadow-sm hover:shadow-md order-last md:order-none'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold ${
                    plan.popular
                      ? 'bg-primary-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-gray-900 mt-2">{plan.name}</h3>

              {/* Price */}
              <div className="mt-4 mb-6">
                {plan.originalPrice && (
                  <span className="text-lg text-gray-400 line-through mr-2">
                    {plan.originalPrice}
                  </span>
                )}
                <span className="text-4xl md:text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Just {plan.monthlyEquivalent}/month
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full mb-6"
                size="lg"
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Secure payment via Stripe
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Files processed locally
          </span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 text-lg">
                Is my data secure?
              </h3>
              <p className="text-gray-600 mt-2">
                Absolutely! All PDF processing happens directly in your browser.
                Your files never leave your device or get uploaded to any server.
              </p>
            </div>
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 text-lg">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600 mt-2">
                Yes, cancel anytime with one click from your account page.
                No questions asked, no hidden fees.
              </p>
            </div>
            <div className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-900 text-lg">
                What's your refund policy?
              </h3>
              <p className="text-gray-600 mt-2">
                You can cancel your subscription anytime from your account page.
                Your access continues until the end of the billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                Do I need to install anything?
              </h3>
              <p className="text-gray-600 mt-2">
                No installation required! PDF Tools works entirely in your browser
                on any device - desktop, tablet, or mobile.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to work smarter?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Start with Free or go Pro for unlimited power.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleSelectPlan(plans[1])}
              disabled={loadingPlan !== null}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              {loadingPlan === 'monthly' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Get Pro - $7.99/mo'
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="border-white text-white hover:bg-white/10"
            >
              Try Free First
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
