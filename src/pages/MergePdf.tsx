import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SortableFileList } from '../components/ui/SortableFileList';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { mergePdfs, downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();

  const handleFilesSelected = async (newFiles: File[]) => {
    // Check file sizes (skip if still loading auth)
    if (maxFileSize !== null) {
      for (const file of newFiles) {
        if (file.size > maxFileSize) {
          setOversizedFile({ size: file.size, maxSize: maxFileSize });
          setShowFileSizeModal(true);
          return;
        }
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleReorder = (newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  };

  const handleClearAll = () => {
    setFiles([]);
    setResult(null);
  };

  const handleMerge = async () => {
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
      setResult(mergedPdf);
      await recordUsage();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Error merging PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadPdf(result, 'merged.pdf');
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
          <div className="mt-6 flex justify-center gap-4">
            {!result ? (
              <Button
                onClick={handleMerge}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  `Merge ${files.length} PDFs`
                )}
              </Button>
            ) : (
              <Button onClick={handleDownload} size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download Merged PDF
              </Button>
            )}
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
        maxSize={oversizedFile?.maxSize || maxFileSize}
      />
    </div>
  );
}
