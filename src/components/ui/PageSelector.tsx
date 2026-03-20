import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { generateAllThumbnails, getPageCount } from '../../lib/pdf/thumbnail';

interface PageSelectorProps {
  file: File;
  selectedPages: number[];
  onSelectionChange: (pages: number[]) => void;
}

export function PageSelector({ file, selectedPages, onSelectionChange }: PageSelectorProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      setLoading(true);
      setError(false);

      try {
        const count = await getPageCount(file);
        if (cancelled) return;
        setPageCount(count);

        const thumbs = await generateAllThumbnails(file, 120);
        if (cancelled) return;
        setThumbnails(thumbs);
      } catch (err) {
        console.error('Failed to generate thumbnails:', err);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const togglePage = (pageNumber: number) => {
    if (selectedPages.includes(pageNumber)) {
      onSelectionChange(selectedPages.filter((p) => p !== pageNumber));
    } else {
      onSelectionChange([...selectedPages, pageNumber].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onSelectionChange(Array.from({ length: pageCount }, (_, i) => i + 1));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading page previews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Failed to load page previews.</p>
        <p className="text-sm">You can still use the manual page range input above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedPages.length} of {pageCount} pages selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Select all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={deselectAll}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            Deselect all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2">
        {thumbnails.map((thumbnail, index) => {
          const pageNumber = index + 1;
          const isSelected = selectedPages.includes(pageNumber);

          return (
            <button
              key={pageNumber}
              onClick={() => togglePage(pageNumber)}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all
                ${isSelected
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
                }
              `}
            >
              <img
                src={thumbnail}
                alt={`Page ${pageNumber}`}
                className="w-full h-auto"
              />
              <div
                className={`
                  absolute bottom-0 left-0 right-0 py-1 text-xs text-center
                  ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-black/60 text-white'
                  }
                `}
              >
                {pageNumber}
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click pages to select or deselect them
      </p>
    </div>
  );
}
