import { useState, useEffect } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import { generateThumbnail } from '../../lib/pdf/thumbnail';

interface PdfThumbnailProps {
  file: File;
  pageNumber?: number;
  maxWidth?: number;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  showPageNumber?: boolean;
}

export function PdfThumbnail({
  file,
  pageNumber = 1,
  maxWidth = 150,
  className = '',
  onClick,
  selected = false,
  showPageNumber = false,
}: PdfThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnail() {
      setLoading(true);
      setError(false);

      try {
        const dataUrl = await generateThumbnail(file, pageNumber, maxWidth);
        if (!cancelled) {
          setThumbnail(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadThumbnail();

    return () => {
      cancelled = true;
    };
  }, [file, pageNumber, maxWidth]);

  const baseClasses = `
    relative rounded-lg overflow-hidden bg-gray-100 border-2 transition-all
    ${selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}
    ${onClick ? 'cursor-pointer hover:border-primary-300' : ''}
    ${className}
  `;

  if (loading) {
    return (
      <div className={baseClasses} style={{ width: maxWidth, height: maxWidth * 1.4 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={baseClasses} style={{ width: maxWidth, height: maxWidth * 1.4 }} onClick={onClick}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <FileWarning className="w-8 h-8 mb-2" />
          <span className="text-xs">Error</span>
        </div>
      </div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <img
        src={thumbnail!}
        alt={`Page ${pageNumber}`}
        className="w-full h-auto"
      />
      {showPageNumber && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1">
          Page {pageNumber}
        </div>
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
