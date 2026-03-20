import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { pdfToImages, downloadAllImages } from '../lib/pdf/convert';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

type Format = 'png' | 'jpeg';

export function ConvertPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<Format>('png');
  const [quality, setQuality] = useState(0.9);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();

  const handleFilesSelected = (newFiles: File[]) => {
    const file = newFiles[0];
    // Check file size (skip if still loading auth)
    if (file && maxFileSize !== null && file.size > maxFileSize) {
      setOversizedFile({ size: file.size, maxSize: maxFileSize });
      setShowFileSizeModal(true);
      return;
    }
    setFiles(newFiles.slice(0, 1));
    setImages([]);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setImages([]);
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
      const convertedImages = await pdfToImages(files[0], {
        format,
        quality,
        scale: 2,
      });
      setImages(convertedImages);
      await recordUsage();
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    const baseName = files[0].name.replace('.pdf', '');
    await downloadAllImages(images, baseName, format);
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

        {images.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Preview ({images.length} pages)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {images.map((img, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={img}
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto"
                  />
                  <div className="p-2 bg-gray-50 text-center text-sm text-gray-600">
                    Page {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 flex justify-center gap-4">
            {images.length === 0 ? (
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
                  'Convert to Images'
                )}
              </Button>
            ) : (
              <Button onClick={handleDownloadAll} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download All Images
              </Button>
            )}
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
    </div>
  );
}
