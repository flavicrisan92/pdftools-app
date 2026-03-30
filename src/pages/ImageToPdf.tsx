import { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { ShareModal } from '../components/ui/ShareModal';
import { imagesToPdf, downloadPdf } from '../lib/pdf/imageToPdf';
import { useAuth } from '../contexts/AuthContext';
import type { PageSize, Orientation, Margin } from '../lib/pdf/imageToPdf';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download, Upload, X, ChevronLeft, ChevronRight, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

interface ImageFile {
  file: File;
  preview: string;
}

export function ImageToPdf() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<Margin>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkUsage, recordUsage, maxFileSize } = useUsage();
  const { user } = useAuth();

  // Show share modal randomly (20% chance) for anonymous users only
  const shouldShowShareModal = () => {
    if (user) return false;
    return Math.random() < 0.2;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files
      .filter((f) => ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

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

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
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
      // Generate filename with timestamp
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      downloadPdf(pdfBytes, `oripdf_${timestamp}.pdf`);
      if (shouldShowShareModal()) {
        setShowShareModal(true);
      }
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

                  {/* Filename overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1.5"
                    title={image.file.name}
                  >
                    <p className="text-white text-[9px] leading-tight break-all line-clamp-2 text-left">
                      {image.file.name}
                    </p>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-1 left-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {index + 1}
                  </div>

                  {/* Reorder buttons (mobile friendly) */}
                  <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(index);
                      }}
                      disabled={index === 0}
                      className={`p-0.5 rounded text-white transition-colors ${
                        index === 0 ? 'bg-black/30 cursor-not-allowed' : 'bg-black/50 hover:bg-black/70'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(index);
                      }}
                      disabled={index === images.length - 1}
                      className={`p-0.5 rounded text-white transition-colors ${
                        index === images.length - 1 ? 'bg-black/30 cursor-not-allowed' : 'bg-black/50 hover:bg-black/70'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preview button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(index);
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute bottom-8 right-1 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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

              {/* Page Margin */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Page Margin
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
        maxSize={oversizedFile?.maxSize || 0}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        toolName="Image to PDF"
      />

      {/* Image Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous button */}
          {previewIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex(previewIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* PDF Page Preview */}
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Page simulation */}
            <div
              className="bg-white shadow-2xl flex items-center justify-center"
              style={{
                width: pageSize === 'fit' ? 'auto' : orientation === 'landscape' ? 'min(80vw, 600px)' : 'min(60vw, 400px)',
                height: pageSize === 'fit' ? 'auto' : orientation === 'landscape' ? 'min(60vh, 400px)' : 'min(75vh, 550px)',
                padding: margin === 'none' ? '0' : margin === 'small' ? '16px' : '32px',
                maxWidth: '90vw',
                maxHeight: '80vh',
              }}
            >
              <img
                src={images[previewIndex].preview}
                alt={images[previewIndex].file.name}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxHeight: pageSize === 'fit' ? '75vh' : '100%',
                }}
              />
            </div>
            <p className="text-white mt-4 text-center">
              {images[previewIndex].file.name}
              <span className="text-white/60 ml-2">
                ({previewIndex + 1} / {images.length})
              </span>
            </p>
            <p className="text-white/50 text-sm mt-1">
              {pageSize === 'fit' ? 'Fit to image' : pageSize.toUpperCase()} • {orientation} • {margin === 'none' ? 'no margin' : `${margin} margin`}
            </p>
          </div>

          {/* Next button */}
          {previewIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex(previewIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
