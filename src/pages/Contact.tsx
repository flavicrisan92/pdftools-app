import { Mail, MessageSquare, Clock } from 'lucide-react';

export function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h2>
        <p className="text-gray-600 mb-6">
          Send us an email and we'll get back to you as soon as possible.
        </p>

        <a
          href="mailto:flanify.gold@gmail.com"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors text-lg font-medium"
        >
          <Mail className="w-5 h-5" />
          flanify.gold@gmail.com
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
          <p className="text-sm text-gray-500">Within 24 hours</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Pro Support</h3>
          <p className="text-sm text-gray-500">Priority response for Pro users</p>
        </div>
      </div>
    </div>
  );
}
