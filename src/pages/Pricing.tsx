import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';

const plans = [
  {
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
    name: 'Pro Monthly',
    price: '$7.99',
    period: '/month',
    features: [
      'Unlimited operations',
      'Max 100MB file size',
      'Advanced compression',
      'No watermark',
      'Priority processing',
      'Cloud storage (1GB)',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Pro Annual',
    price: '$49.99',
    period: '/year',
    features: [
      'Everything in Pro Monthly',
      'Save 48% vs monthly',
      '2GB cloud storage',
      'Priority support',
    ],
    cta: 'Best Value',
    popular: false,
  },
];

export function Pricing() {
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
            >
              {plan.cta}
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
