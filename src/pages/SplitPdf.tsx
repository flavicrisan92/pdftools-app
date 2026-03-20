import { useState, useEffect } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { PageSelector } from '../components/ui/PageSelector';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { splitPdf, extractAllPages } from '../lib/pdf/split';
import { downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download } from 'lucide-react';
import { FREE_LIMIT } from '../types/user';

export function SplitPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageRange, setPageRange] = useState('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();

  // Sync selectedPages to pageRange input
  useEffect(() => {
    if (selectedPages.length === 0) {
      setPageRange('');
      return;
    }

    // Convert selected pages array to range string (e.g., [1,2,3,5,7,8,9] -> "1-3, 5, 7-9")
    const ranges: string[] = [];
    let rangeStart = selectedPages[0];
    let rangeEnd = selectedPages[0];

    for (let i = 1; i <= selectedPages.length; i++) {
      if (i < selectedPages.length && selectedPages[i] === rangeEnd + 1) {
        rangeEnd = selectedPages[i];
      } else {
        if (rangeStart === rangeEnd) {
          ranges.push(String(rangeStart));
        } else {
          ranges.push(`${rangeStart}-${rangeEnd}`);
        }
        if (i < selectedPages.length) {
          rangeStart = selectedPages[i];
          rangeEnd = selectedPages[i];
        }
      }
    }

    setPageRange(ranges.join(', '));
  }, [selectedPages]);

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
    setSelectedPages([]);
    setPageRange('');
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setResult(null);
    setSelectedPages([]);
    setPageRange('');
  };

  const handleSplit = async () => {
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
      if (mode === 'range' && pageRange) {
        const splitResult = await splitPdf(files[0], { pageRanges: pageRange });
        setResult(splitResult);
      } else if (mode === 'all') {
        const pages = await extractAllPages(files[0]);
        pages.forEach((page, index) => {
          downloadPdf(page, `page_${index + 1}.pdf`);
        });
      }
      await recordUsage();
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Error splitting PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadPdf(result, 'split.pdf');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Split PDF</h1>
        <p className="text-gray-600">Extract specific pages from your PDF</p>
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
          <div className="mt-6 space-y-6">
            {/* Mode selector */}
            <div className="flex gap-4">
              <button
                onClick={() => setMode('range')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  mode === 'range'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Extract Selected Pages
              </button>
              <button
                onClick={() => setMode('all')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  mode === 'all'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Extract All Pages
              </button>
            </div>

            {mode === 'range' && (
              <>
                {/* Manual input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Range (e.g., 1-3, 5, 7-9)
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => {
                      setPageRange(e.target.value);
                      // Clear visual selection when manually editing
                      setSelectedPages([]);
                    }}
                    placeholder="1-3, 5, 7-9"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Visual page selector */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Or click pages to select:
                  </h3>
                  <PageSelector
                    file={files[0]}
                    selectedPages={selectedPages}
                    onSelectionChange={setSelectedPages}
                  />
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
              {!result ? (
                <Button
                  onClick={handleSplit}
                  disabled={(mode === 'range' && !pageRange) || isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : mode === 'all' ? (
                    'Extract All Pages'
                  ) : (
                    'Extract Selected Pages'
                  )}
                </Button>
              ) : (
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Split PDF
                </Button>
              )}
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
    </div>
  );
}
