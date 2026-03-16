import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { splitPdf, extractAllPages } from '../lib/pdf/split';
import { downloadPdf } from '../lib/pdf/merge';
import { Loader2, Download } from 'lucide-react';

export function SplitPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [mode, setMode] = useState<'range' | 'all'>('range');

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles.slice(0, 1)); // Only allow one file
    setResult(null);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setResult(null);
  };

  const handleSplit = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      if (mode === 'range' && pageRange) {
        const splitResult = await splitPdf(files[0], { pageRanges: pageRange });
        setResult(splitResult);
      } else if (mode === 'all') {
        const pages = await extractAllPages(files[0]);
        // For simplicity, download all as separate files
        pages.forEach((page, index) => {
          downloadPdf(page, `page_${index + 1}.pdf`);
        });
      }
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
    <div className="max-w-3xl mx-auto px-4 py-12">
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
        />

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setMode('range')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  mode === 'range'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Extract Range
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Range (e.g., 1-3, 5, 7-9)
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="1-3, 5, 7-9"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          {!result ? (
            <Button
              onClick={handleSplit}
              disabled={files.length === 0 || (mode === 'range' && !pageRange) || isProcessing}
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
                'Extract Pages'
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
    </div>
  );
}
