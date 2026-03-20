import { useState, useRef } from 'react';
import { GripVertical, X } from 'lucide-react';
import { PdfThumbnail } from './PdfThumbnail';

interface SortableFileListProps {
  files: File[];
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
}

export function SortableFileList({ files, onReorder, onRemove }: SortableFileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNode.current = e.target as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());

    // Make the drag image semi-transparent
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    onReorder(newFiles);
    setDragOverIndex(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          className={`
            flex items-center gap-4 p-3 bg-white rounded-lg border-2 transition-all
            ${draggedIndex === index ? 'opacity-50' : ''}
            ${dragOverIndex === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}
            ${draggedIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
          `}
        >
          {/* Drag handle */}
          <div className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <PdfThumbnail file={file} maxWidth={80} />
          </div>

          {/* File info */}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Order badge */}
          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(index)}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      <p className="text-xs text-gray-500 text-center mt-2">
        Drag and drop to reorder
      </p>
    </div>
  );
}
