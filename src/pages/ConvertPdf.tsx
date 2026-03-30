import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { ShareModal } from '../components/ui/ShareModal';
import { pdfToImages, downloadAllImages } from '../lib/pdf/convert';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download, Image, RefreshCw } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

type Format = 'png' | 'jpeg';

export function ConvertPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<Format>('png');
  const [quality, setQuality] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();
  const { user } = useAuth();

  // Show share modal randomly (20% chance) for anonymous users only
  const shouldShowShareModal = () => {
    if (user) return false;
    return Math.random() < 0.2;
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles.slice(0, 1));
    setConvertedImages([]);
    setSelectedImage(null);
  };

  const handleFileSizeError = (fileSize: number, maxSize: number) => {
    setOversizedFile({ size: fileSize, maxSize });
    setShowFileSizeModal(true);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setConvertedImages([]);
    setSelectedImage(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    // Check usage limit
    const stats = await checkUsage();
    if (!stats.canPerform) {
      setUsageCount(stats.operationsToday);
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const images = await pdfToImages(files[0], {
        format,
        quality,
        scale: 2,
      });
      await recordUsage();
      setConvertedImages(images);
      setSelectedImage(0);
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (convertedImages.length === 0) return;
    const baseName = files[0].name.replace('.pdf', '');
    await downloadAllImages(convertedImages, baseName, format);
    if (shouldShowShareModal()) {
      setShowShareModal(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF to Image</h1>
        <p className="text-gray-600">Convert PDF pages to high-quality images</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={handleRemoveFile}
          multiple={false}
          maxSize={maxFileSize}
          onFileSizeError={handleFileSizeError}
        />

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Format
              </label>
              <div className="flex gap-4">
                {(['png', 'jpeg'] as Format[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      format === f
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium uppercase">{f}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {f === 'png' ? 'Lossless, larger files' : 'Smaller files'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {format === 'jpeg' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Convert button - show when file selected but not yet converted */}
        {files.length > 0 && convertedImages.length === 0 && (
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
                  <Image className="w-5 h-5 mr-2" />
                  Convert to {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Preview section - show after conversion */}
        {convertedImages.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Converted Images ({convertedImages.length} {convertedImages.length === 1 ? 'page' : 'pages'})
              </h3>
              <button
                onClick={handleRemoveFile}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Convert another
              </button>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {convertedImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Large preview */}
            {selectedImage !== null && (
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <img
                  src={convertedImages[selectedImage]}
                  alt={`Page ${selectedImage + 1}`}
                  className="max-h-[400px] mx-auto object-contain"
                />
                <p className="text-center text-sm text-gray-500 mt-2">
                  Page {selectedImage + 1} of {convertedImages.length}
                </p>
              </div>
            )}

            {/* Download button */}
            <div className="flex justify-center">
              <Button onClick={handleDownload} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download {convertedImages.length === 1 ? 'Image' : 'All Images (ZIP)'}
              </Button>
            </div>
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
        toolName="PDF to Image"
      />
    </div>
  );
}
