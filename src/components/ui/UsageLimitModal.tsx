import { X } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  used: number;
  limit: number;
}

export function UsageLimitModal({ isOpen, onClose, used, limit }: UsageLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Daily Limit Reached
          </h2>

          <p className="text-gray-600 mb-4">
            You've used <strong>{used}/{limit}</strong> free operations today.
            Upgrade to Pro for unlimited access.
          </p>

          <div className="space-y-3">
            <Link to="/pricing" className="block">
              <Button className="w-full" size="lg">
                Upgrade to Pro
              </Button>
            </Link>

            <Button variant="secondary" className="w-full" onClick={onClose}>
              Try Again Tomorrow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
