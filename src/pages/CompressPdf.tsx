import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { compressPdf, formatFileSize, calculateCompressionRatio } from '../lib/pdf/compress';
import { downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
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
    setResult(null);
    setStats(null);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setResult(null);
    setStats(null);
  };

  const handleCompress = async () => {
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
      setResult(compressed);
      setStats({
        original: files[0].size,
        compressed: compressed.length,
      });
      await recordUsage();
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Error compressing PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadPdf(result, `compressed_${files[0].name}`);
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
        />

        {files.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Compression:</strong> Removes metadata and optimizes PDF structure.
              Works best on PDFs with embedded images or unoptimized content.
            </p>
          </div>
        )}

        {stats && (() => {
          const ratio = calculateCompressionRatio(stats.original, stats.compressed);
          const isSmaller = ratio > 0;
          return (
            <div className={`mt-6 p-4 rounded-lg ${isSmaller ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Original: {formatFileSize(stats.original)}</p>
                  <p className="text-sm text-gray-600">Compressed: {formatFileSize(stats.compressed)}</p>
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
          <div className="mt-6 flex justify-center gap-4">
            {!result ? (
              <Button
                onClick={handleCompress}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  'Compress PDF'
                )}
              </Button>
            ) : (
              <Button onClick={handleDownload} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download Compressed PDF
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
        maxSize={oversizedFile?.maxSize || maxFileSize}
      />
    </div>
  );
}
