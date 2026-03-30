import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SortableFileList } from '../components/ui/SortableFileList';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { ShareModal } from '../components/ui/ShareModal';
import { mergePdfs, downloadPdf } from '../lib/pdf/merge';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();
  const { user } = useAuth();

  // Show share modal randomly (20% chance) for anonymous users only
  const shouldShowShareModal = () => {
    if (user) return false; // Don't show for logged-in users
    return Math.random() < 0.2; // 20% chance
  };

  const handleFilesSelected = async (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSizeError = (fileSize: number, maxSize: number) => {
    setOversizedFile({ size: fileSize, maxSize });
    setShowFileSizeModal(true);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReorder = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleMergeAndDownload = async () => {
    if (files.length < 2) return;

    // Check usage limit
    const stats = await checkUsage();
    if (!stats.canPerform) {
      setUsageCount(stats.operationsToday);
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await mergePdfs(files);
      await recordUsage();
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      downloadPdf(mergedPdf, `oripdf_${timestamp}.pdf`);
      if (shouldShowShareModal()) {
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Error merging PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Merge PDF Files</h1>
        <p className="text-gray-600">
          Combine multiple PDF files into a single document
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          files={[]}
          onRemoveFile={() => {}}
          multiple={true}
          maxSize={maxFileSize}
          onFileSizeError={handleFileSizeError}
        />

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>

            <SortableFileList
              files={files}
              onReorder={handleReorder}
              onRemove={handleRemoveFile}
            />
          </div>
        )}

        {files.length >= 2 && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleMergeAndDownload}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Merge & Download
                </>
              )}
            </Button>
          </div>
        )}

        {files.length === 1 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Add at least one more PDF to merge
          </p>
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
        toolName="Merge PDF"
      />
    </div>
  );
}
