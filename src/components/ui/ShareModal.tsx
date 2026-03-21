import { X, Twitter, Linkedin, Facebook, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
}

const SHARE_URL = 'https://oripdf.com';
const SHARE_TEXT = 'Free PDF tools that actually work - merge, split, compress PDFs online. No signup required!';

export function ShareModal({ isOpen, onClose, toolName = 'PDF tool' }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Download Complete!
          </h2>

          <p className="text-gray-600 mb-6">
            Enjoying OriPDF? Share it with others!
          </p>

          {/* Share buttons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
              <span className="text-xs text-gray-600">Twitter</span>
            </button>

            <button
              onClick={handleLinkedInShare}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
              <span className="text-xs text-gray-600">LinkedIn</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Facebook className="w-6 h-6 text-[#1877F2]" />
              <span className="text-xs text-gray-600">Facebook</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <Link2 className="w-6 h-6 text-gray-600" />
              )}
              <span className="text-xs text-gray-600">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>

          <Button variant="secondary" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
