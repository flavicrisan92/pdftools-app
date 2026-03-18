import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { mergePdfs, downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download, ArrowUpDown } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const { checkUsage, recordUsage } = useUsage();

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleClearAll = () => {
    setFiles([]);
    setResult(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < files.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setFiles(newFiles);
    }
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
          files={files}
          onRemoveFile={handleRemoveFile}
          onClearAll={handleClearAll}
          multiple={true}
        />

        {files.length > 1 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Drag files to reorder, or use arrows
            </p>
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                <span className="flex-1 text-sm truncate">{file.name}</span>
                <button
                  onClick={() => moveFile(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveFile(index, 'down')}
                  disabled={index === files.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            ))}
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
      </div>

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        used={usageCount}
        limit={FREE_LIMIT}
      />
    </div>
  );
}
