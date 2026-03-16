import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">PDF Tools</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/merge" className="text-gray-600 hover:text-primary-600 transition-colors">
              Merge
            </Link>
            <Link to="/split" className="text-gray-600 hover:text-primary-600 transition-colors">
              Split
            </Link>
            <Link to="/compress" className="text-gray-600 hover:text-primary-600 transition-colors">
              Compress
            </Link>
            <Link to="/convert" className="text-gray-600 hover:text-primary-600 transition-colors">
              PDF to Image
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
