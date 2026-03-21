import { X } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { formatFileSize } from '../../types/user';

interface FileSizeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileSize: number;
  maxSize: number;
}

export function FileSizeLimitModal({ isOpen, onClose, fileSize, maxSize }: FileSizeLimitModalProps) {
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📁</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            File Too Large
          </h2>

          <p className="text-gray-600 mb-4">
            Your file is <strong>{formatFileSize(fileSize)}</strong>, but the maximum
            allowed size for free users is <strong>{formatFileSize(maxSize)}</strong>.
          </p>

          <p className="text-gray-500 text-sm mb-4">
            Upgrade to Pro to process files up to 100MB.
          </p>

          <div className="space-y-3">
            <Link to="/pricing" className="block">
              <Button className="w-full" size="lg">
                Upgrade to Pro
              </Button>
            </Link>

            <Button variant="secondary" className="w-full" onClick={onClose}>
              Use a Smaller File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
