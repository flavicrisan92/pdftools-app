import { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { imagesToPdf, downloadPdf } from '../lib/pdf/imageToPdf';
import type { PageSize, Orientation, Margin } from '../lib/pdf/imageToPdf';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download, Upload, GripVertical, X } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

interface ImageFile {
  file: File;
  preview: string;
}

export function ImageToPdf() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<Margin>('small');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkUsage, recordUsage, maxFileSize } = useUsage();

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) =>
      ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type)
    );

    // Check file sizes (skip if still loading auth)
    if (maxFileSize !== null) {
      for (const file of imageFiles) {
        if (file.size > maxFileSize) {
          setOversizedFile({ size: file.size, maxSize: maxFileSize });
          setShowFileSizeModal(true);
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }
    }

    const newImages = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    // Check usage limit
    const stats = await checkUsage();
    if (!stats.canPerform) {
      setUsageCount(stats.operationsToday);
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await imagesToPdf(
        images.map((img) => img.file),
        { pageSize, orientation, margin }
      );
      await recordUsage();
      // Download directly
      downloadPdf(pdfBytes, 'images.pdf');
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Error converting images to PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image to PDF</h1>
        <p className="text-gray-600">
          Convert images to a PDF document
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Upload area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Click to select images or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            Supports PNG, JPEG, and WebP
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Images ({images.length})
              </h3>
              <button
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab
                    ${draggedIndex === index ? 'opacity-50' : ''}
                    ${dragOverIndex === index ? 'border-primary-500 scale-105' : 'border-gray-200'}
                  `}
                >
                  <img
                    src={image.preview}
                    alt={`Image ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />

                  {/* Order badge */}
                  <div className="absolute top-1 left-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {index + 1}
                  </div>

                  {/* Drag handle */}
                  <div className="absolute top-1 right-1 p-1 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute bottom-1 right-1 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              Drag images to reorder them in the PDF
            </p>
          </div>
        )}

        {/* Options */}
        {images.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Options</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Page Size */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Page Size
                </label>
                <div className="flex gap-2">
                  {(['a4', 'letter', 'fit'] as PageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                        pageSize === size
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size === 'fit' ? 'Fit' : size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              {pageSize !== 'fit' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Orientation
                  </label>
                  <div className="flex gap-2">
                    {(['auto', 'portrait', 'landscape'] as Orientation[]).map((o) => (
                      <button
                        key={o}
                        onClick={() => setOrientation(o)}
                        className={`flex-1 py-2 px-2 rounded-lg border text-sm transition-colors ${
                          orientation === o
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Margin */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Margin
                </label>
                <div className="flex gap-2">
                  {(['none', 'small', 'medium'] as Margin[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMargin(m)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                        margin === m
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        {images.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Convert & Download PDF
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        used={usageCount}
        limit={FREE_LIMIT}
      />

      <FileSizeLimitModal
        isOpen={showFileSizeModal}
        onClose={() => setShowFileSizeModal(false)}
        fileSize={oversizedFile?.size || 0}
        maxSize={oversizedFile?.maxSize || maxFileSize}
      />
    </div>
  );
}
