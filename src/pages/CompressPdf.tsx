import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { ShareModal } from '../components/ui/ShareModal';
import { compressPdf, formatFileSize, calculateCompressionRatio } from '../lib/pdf/compress';
import { useAuth } from '../contexts/AuthContext';
import { downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();
  const { user } = useAuth();

  // Show share modal randomly (20% chance) for anonymous users only
  const shouldShowShareModal = () => {
    if (user) return false;
    return Math.random() < 0.2;
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles.slice(0, 1));
    setCompressionStats(null);
  };

  const handleFileSizeError = (fileSize: number, maxSize: number) => {
    setOversizedFile({ size: fileSize, maxSize });
    setShowFileSizeModal(true);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setCompressionStats(null);
  };

  const handleCompressAndDownload = async () => {
    if (files.length === 0) return;

    // Check usage limit
    const usageStats = await checkUsage();
    if (!usageStats.canPerform) {
      setUsageCount(usageStats.operationsToday);
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressPdf(files[0], { quality: 'medium' });
      setCompressionStats({
        original: files[0].size,
        compressed: compressed.length,
      });
      await recordUsage();
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      downloadPdf(compressed, `oripdf_${timestamp}.pdf`);
      if (shouldShowShareModal()) {
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Error compressing PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-600">Reduce PDF file size while maintaining quality</p>
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
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Compression:</strong> Removes metadata and optimizes PDF structure.
              Works best on PDFs with embedded images or unoptimized content.
            </p>
          </div>
        )}

        {compressionStats && (() => {
          const ratio = calculateCompressionRatio(compressionStats.original, compressionStats.compressed);
          const isSmaller = ratio > 0;
          return (
            <div className={`mt-6 p-4 rounded-lg ${isSmaller ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Original: {formatFileSize(compressionStats.original)}</p>
                  <p className="text-sm text-gray-600">Compressed: {formatFileSize(compressionStats.compressed)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isSmaller ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isSmaller ? `-${ratio}%` : `+${Math.abs(ratio)}%`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isSmaller ? 'smaller' : 'larger (already optimized)'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleCompressAndDownload}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Compress & Download
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
        toolName="Compress PDF"
      />
    </div>
  );
}
