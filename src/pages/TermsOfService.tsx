export function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing and using OriPDF, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="text-gray-600 mb-4">
            OriPDF provides PDF manipulation tools including merging, splitting,
            compressing, and converting PDF files.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Free and Pro Plans</h2>
          <p className="text-gray-600 mb-4">
            We offer both free and paid (Pro) plans:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Free Plan:</strong> Limited to 3 operations per day.</li>
            <li><strong>Pro Plan:</strong> Unlimited operations, larger file support, and priority features.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Accounts</h2>
          <p className="text-gray-600 mb-4">
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
          <p className="text-gray-600 mb-4">
            You agree not to use OriPDF to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Process illegal or unauthorized content</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Attempt to circumvent usage limits or security measures</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
          <p className="text-gray-600 mb-4">
            OriPDF and its original content, features, and functionality are owned by us
            and are protected by international copyright, trademark, and other intellectual
            property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
          <p className="text-gray-600 mb-4">
            OriPDF is provided "as is" without warranties of any kind. We do not guarantee
            that the service will be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            We shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Subscriptions and Billing</h2>
          <p className="text-gray-600 mb-4">
            Pro subscriptions are billed monthly or annually. You may cancel your subscription
            at any time, and it will remain active until the end of the current billing period.
            Refunds are handled on a case-by-case basis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
          <p className="text-gray-600 mb-4">
            We reserve the right to modify these terms at any time. We will notify users of
            significant changes via email or through the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
          <p className="text-gray-600">
            For questions about these Terms of Service, please contact us through our{' '}
            <a href="/contact" className="text-primary-600 hover:text-primary-700">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
