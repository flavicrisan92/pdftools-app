import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { Accept, FileRejection } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  onClearAll?: () => void;
  accept?: Accept;
  multiple?: boolean;
  maxSize?: number | null;
  onFileSizeError?: (fileSize: number, maxSize: number) => void;
}

export function FileDropzone({
  onFilesSelected,
  files,
  onRemoveFile,
  onClearAll,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  maxSize = null,
  onFileSizeError,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const onDropRejected = useCallback(
    (rejectedFiles: FileRejection[]) => {
      // Check if any file was rejected due to size
      const oversizedFile = rejectedFiles.find((r) =>
        r.errors.some((e) => e.code === 'file-too-large')
      );
      if (oversizedFile && maxSize && onFileSizeError) {
        onFileSizeError(oversizedFile.file.size, maxSize);
      }
    },
    [maxSize, onFileSizeError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    multiple,
    ...(maxSize && { maxSize }),
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop the files here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Drag & drop PDF files here, or click to select
            </p>
            {maxSize && (
              <p className="text-gray-400 text-sm mt-2">
                Max file size: {formatSize(maxSize)}
              </p>
            )}
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {onClearAll && files.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={onClearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          )}
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
