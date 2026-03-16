import { Link } from 'react-router-dom';
import { Merge, Scissors, Minimize2, Image } from 'lucide-react';

const tools = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one document',
    icon: Merge,
    path: '/merge',
    color: 'bg-blue-500',
  },
  {
    name: 'Split PDF',
    description: 'Extract pages from your PDF',
    icon: Scissors,
    path: '/split',
    color: 'bg-green-500',
  },
  {
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    icon: Minimize2,
    path: '/compress',
    color: 'bg-orange-500',
  },
  {
    name: 'PDF to Image',
    description: 'Convert PDF pages to JPG or PNG',
    icon: Image,
    path: '/convert',
    color: 'bg-purple-500',
  },
];

export function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Free Online PDF Tools
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Merge, split, compress, and convert PDF files. Fast, secure, and completely free.
          All processing happens in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all"
          >
            <div
              className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <tool.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
            <p className="text-gray-600 text-sm">{tool.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-16 bg-primary-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Why Choose PDF Tools?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900">100% Secure</h3>
            <p className="text-gray-600 text-sm mt-1">
              Files are processed locally in your browser. Nothing uploaded to servers.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
            <p className="text-gray-600 text-sm mt-1">
              No upload/download time. Process files instantly.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900">Free Forever</h3>
            <p className="text-gray-600 text-sm mt-1">
              Basic features are free. Upgrade for unlimited access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
