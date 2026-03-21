export function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Privacy Matters</h2>
          <p className="text-gray-600 mb-4">
            OriPDF is designed with privacy and security as core principles. We take appropriate
            measures to protect your data and ensure secure processing of your files.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data We Collect</h2>
          <p className="text-gray-600 mb-4">
            We collect minimal data necessary to provide our service:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Account Information:</strong> If you create an account, we store your email address and authentication details.</li>
            <li><strong>Usage Statistics:</strong> We track the number of operations performed to enforce usage limits.</li>
            <li><strong>Payment Information:</strong> For Pro subscribers, payment processing is handled securely by Stripe. We do not store your credit card details.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data We Do NOT Collect</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Your PDF files or their contents</li>
            <li>Images you convert to PDF</li>
            <li>Any document metadata</li>
          </ul>
          <p className="text-gray-600">
            All file processing occurs client-side in your browser using JavaScript. Files are
            processed in memory and are never transmitted over the network.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies</h2>
          <p className="text-gray-600 mb-4">
            We use essential cookies for authentication and session management. We do not use
            tracking cookies or share data with third-party advertisers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Firebase:</strong> Used for authentication and storing account data.</li>
            <li><strong>Stripe:</strong> Used for secure payment processing.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Access your personal data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have questions about this Privacy Policy, please contact us through our{' '}
            <a href="/contact" className="text-primary-600 hover:text-primary-700">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
