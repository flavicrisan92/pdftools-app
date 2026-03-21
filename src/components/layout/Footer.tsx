import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} OriPDF. All rights reserved.
            {import.meta.env.VITE_APP_VERSION && (
              <span className="ml-2 text-gray-400">
                {import.meta.env.VITE_APP_VERSION}
              </span>
            )}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
