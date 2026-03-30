import { Link } from 'react-router-dom';
import { Merge, Scissors, Minimize2, Image, FileImage, PenTool, Shield, Zap, Lock } from 'lucide-react';

const tools = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDFs',
    icon: Merge,
    path: '/merge',
    color: 'bg-blue-500',
    popular: true,
  },
  {
    name: 'Split PDF',
    description: 'Extract pages',
    icon: Scissors,
    path: '/split',
    color: 'bg-green-500',
    popular: true,
  },
  {
    name: 'Compress PDF',
    description: 'Reduce file size',
    icon: Minimize2,
    path: '/compress',
    color: 'bg-orange-500',
    popular: false,
  },
  {
    name: 'PDF to Image',
    description: 'Convert to JPG/PNG',
    icon: Image,
    path: '/convert',
    color: 'bg-purple-500',
    popular: false,
  },
  {
    name: 'Image to PDF',
    description: 'Create PDF from images',
    icon: FileImage,
    path: '/image-to-pdf',
    color: 'bg-pink-500',
    popular: false,
  },
  {
    name: 'Sign Document',
    description: 'Sign PDF, images, Word',
    icon: PenTool,
    path: '/sign',
    color: 'bg-indigo-500',
    popular: false,
  },
];

const popularTools = tools.filter(t => t.popular);
const otherTools = tools.filter(t => !t.popular);

export function Home() {
  return (
    <div className="md:min-h-[calc(100vh-4rem)]">
      {/* MOBILE LAYOUT - full viewport height so footer is below fold */}
      <div className="md:hidden min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Hero - Minimal, action-focused */}
        <div className="px-4 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Edit PDFs Instantly
          </h1>
          <p className="text-gray-500 text-sm">
            Free. Fast. Secure.
          </p>
        </div>

        {/* Primary CTA - Most used tools */}
        <div className="px-4 mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Most Popular
          </p>
          <div className="grid grid-cols-2 gap-3">
            {popularTools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className={`${tool.color} rounded-2xl p-4 text-white active:opacity-90`}
              >
                <tool.icon className="w-8 h-8 mb-2" />
                <span className="font-semibold">{tool.name}</span>
                <p className="text-white/80 text-xs mt-0.5">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary tools - 2 column grid for 4 tools */}
        <div className="px-4 mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            More Tools
          </p>
          <div className="grid grid-cols-2 gap-2">
            {otherTools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="flex flex-col items-center bg-white border border-gray-200 rounded-xl py-3 px-2 active:bg-gray-50"
              >
                <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center mb-1.5`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-900 text-center leading-tight">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust signals - Centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex justify-around w-full text-center">
            <div className="flex flex-col items-center">
              <Zap className="w-5 h-5 text-yellow-600 mb-1" />
              <span className="text-xs text-gray-500">Fast</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs text-gray-500">Secure</span>
            </div>
            <div className="flex flex-col items-center">
              <Lock className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-xs text-gray-500">Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OriPDF - Tools That Just Work
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Merge, split, compress and convert PDFs instantly.
            Fast, secure, and easy to use.
          </p>

          {/* Trust badges inline */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Free to Use</span>
            </div>
          </div>
        </div>

        {/* Tools Grid - 3 columns (2 rows of 3) */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 transition-all"
            >
              {tool.popular && (
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div
                className={`w-14 h-14 ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <tool.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-gray-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>

        {/* Social Proof / CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Ready to go Pro?
          </h2>
          <p className="text-primary-100 mb-6 max-w-lg mx-auto">
            Unlimited operations, larger files, priority processing.
            No watermarks, ever.
          </p>
          <Link
            to="/pricing"
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
