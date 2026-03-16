import { useState } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { compressPdf, formatFileSize, calculateCompressionRatio } from '../lib/pdf/compress';
import { downloadPdf } from '../lib/pdf/merge';
import { Loader2, Download } from 'lucide-react';

type Quality = 'low' | 'medium' | 'high';

export function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<Quality>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
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

    setIsProcessing(true);
    try {
      const compressed = await compressPdf(files[0], { quality });
      setResult(compressed);
      setStats({
        original: files[0].size,
        compressed: compressed.length,
      });
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
        />

        {files.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Compression Level
            </label>
            <div className="flex gap-4">
              {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    quality === q
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium capitalize">{q}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {q === 'low' && 'Smaller file, lower quality'}
                    {q === 'medium' && 'Balanced'}
                    {q === 'high' && 'Better quality, larger file'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {stats && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Original: {formatFileSize(stats.original)}</p>
                <p className="text-sm text-gray-600">Compressed: {formatFileSize(stats.compressed)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  -{calculateCompressionRatio(stats.original, stats.compressed)}%
                </p>
                <p className="text-sm text-gray-500">reduction</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          {!result ? (
            <Button
              onClick={handleCompress}
              disabled={files.length === 0 || isProcessing}
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
      </div>
    </div>
  );
}
