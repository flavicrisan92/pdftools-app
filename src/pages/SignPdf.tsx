import { useState, useRef, useEffect, useCallback } from 'react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SignaturePad } from '../components/ui/SignaturePad';
import { Button } from '../components/ui/Button';
import { UsageLimitModal } from '../components/ui/UsageLimitModal';
import { FileSizeLimitModal } from '../components/ui/FileSizeLimitModal';
import { ShareModal } from '../components/ui/ShareModal';
import { addSignaturesToPdf, getPdfPageCount, renderPdfPageToCanvas } from '../lib/pdf/sign';
import { useAuth } from '../contexts/AuthContext';
import { downloadPdf } from '../lib/pdf/merge';
import { useUsage } from '../hooks/useUsage';
import { Loader2, Download, Plus, Trash2 } from 'lucide-react';
import { removeBackground, autoCropToContent } from '../lib/image/removeBackground';
import { FREE_LIMIT } from '../types/user';
import { convertToPdf, detectFileType, getAcceptedExtensions } from '../lib/document/convert';

interface SignaturePosition {
  x: number;
  y: number;
}

interface SignatureSize {
  width: number;
  height: number;
}

interface SignatureItem {
  id: string;
  image: string;
  pagePositions: Record<number, SignaturePosition>;
  pageSizes: Record<number, SignatureSize>;
  aspectRatio: number;
  selectedPages: number[];
  source: 'draw' | 'upload' | 'saved'; // Track where signature came from
}

export function SignPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSignatureImage, setNewSignatureImage] = useState<string | null>(null);
  const [newSignatureSource, setNewSignatureSource] = useState<'draw' | 'upload' | 'saved'>('draw');
  const [pageCount, setPageCount] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showFileSizeModal, setShowFileSizeModal] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<{ size: number; maxSize: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedSignatureId, setDraggedSignatureId] = useState<string | null>(null);
  const [processingBgRemoval, setProcessingBgRemoval] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { checkUsage, recordUsage, maxFileSize } = useUsage();
  const { user } = useAuth();

  // Default position/size - ensure signature fits within bounds
  const getDefaultSize = (aspectRatio: number) => {
    const maxWidth = 20;
    const maxHeight = 12; // Keep signature compact
    const rawHeight = maxWidth / aspectRatio;

    if (rawHeight > maxHeight) {
      // Constrain by height
      return { width: maxHeight * aspectRatio, height: maxHeight };
    }
    return { width: maxWidth, height: rawHeight };
  };

  // Default position - offset each signature so they don't overlap
  const getDefaultPosition = (size: SignatureSize, signatureIndex = 0) => {
    // Offset each signature by its index to prevent overlapping
    const xOffset = (signatureIndex % 3) * 25; // 0, 25, 50 for first 3 signatures
    const yOffset = Math.floor(signatureIndex / 3) * 15; // Stack vertically after 3

    return {
      x: Math.max(0, Math.min(100 - size.width, 10 + xOffset)),
      y: Math.max(0, Math.min(100 - size.height, 70 - yOffset)),
    };
  };

  const shouldShowShareModal = () => {
    if (user) return false;
    return Math.random() < 0.2;
  };

  // Load page count and thumbnails when file changes
  useEffect(() => {
    if (files.length === 0) {
      setPageCount(0);
      setPageThumbnails([]);
      setPreviewImage(null);
      return;
    }

    const loadPdfInfo = async () => {
      try {
        const count = await getPdfPageCount(files[0]);
        setPageCount(count);
        setPreviewPage(1);

        const thumbnails: string[] = [];
        for (let i = 1; i <= Math.min(count, 20); i++) {
          const canvas = await renderPdfPageToCanvas(files[0], i, 0.3);
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
        }
        setPageThumbnails(thumbnails);
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF. Please try a different file.');
      }
    };

    loadPdfInfo();
  }, [files]);

  // Load preview image when preview page changes
  useEffect(() => {
    if (files.length === 0 || previewPage < 1) return;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        // Render at scale 1 to get actual document dimensions
        const canvas = await renderPdfPageToCanvas(files[0], previewPage, 1);
        const actualWidth = canvas.width;
        const actualHeight = canvas.height;

        // Cap at max 500px but don't scale up small images
        const maxSize = 500;
        let displayWidth = actualWidth;
        let displayHeight = actualHeight;

        if (actualWidth > maxSize || actualHeight > maxSize) {
          const scale = Math.min(maxSize / actualWidth, maxSize / actualHeight);
          displayWidth = actualWidth * scale;
          displayHeight = actualHeight * scale;
        }

        setPreviewDimensions({ width: displayWidth, height: displayHeight });
        setPreviewImage(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Error loading preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadPreview();
  }, [files, previewPage]);

  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    const file = newFiles[0];
    setSignatures([]);
    setActiveSignatureId(null);

    const fileType = detectFileType(file);

    if (fileType === 'pdf') {
      // Already PDF, use directly
      setFiles([file]);
    } else if (fileType === 'unknown') {
      alert('Unsupported file type. Please upload a PDF, image, or Word document.');
      return;
    } else {
      // Need to convert to PDF
      setIsConverting(true);
      try {
        const pdfFile = await convertToPdf(file);
        setFiles([pdfFile]);
      } catch (error) {
        console.error('Error converting file:', error);
        alert('Error converting document. Please try a different file.');
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleFileSizeError = (fileSize: number, maxSize: number) => {
    setOversizedFile({ size: fileSize, maxSize });
    setShowFileSizeModal(true);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setSignatures([]);
    setActiveSignatureId(null);
  };

  // Add new signature
  const handleAddSignature = () => {
    setIsAddingNew(true);
    setNewSignatureImage(null);
  };

  const handleNewSignatureChange = (image: string | null, source: 'draw' | 'upload' | 'saved') => {
    setNewSignatureImage(image);
    setNewSignatureSource(source);
  };

  // Directly add a saved signature (from the Saved tab)
  const handleUseSavedSignature = async (imageUrl: string) => {
    try {
      const croppedImage = await autoCropToContent(imageUrl, 5);

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newSig: SignatureItem = {
          id: Date.now().toString(),
          image: croppedImage,
          pagePositions: {},
          pageSizes: {},
          aspectRatio,
          selectedPages: pageCount === 1 ? [1] : [],
          source: 'saved',
        };
        setSignatures(prev => [...prev, newSig]);
        setActiveSignatureId(newSig.id);
        setIsAddingNew(false);
        setNewSignatureImage(null);
      };
      img.src = croppedImage;
    } catch (error) {
      console.error('Error processing saved signature:', error);
    }
  };

  const handleConfirmNewSignature = async () => {
    if (!newSignatureImage) return;

    try {
      // Auto-crop signature to its content bounds
      const croppedImage = await autoCropToContent(newSignatureImage, 5);

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newSig: SignatureItem = {
          id: Date.now().toString(),
          image: croppedImage,
          pagePositions: {},
          pageSizes: {},
          aspectRatio,
          selectedPages: pageCount === 1 ? [1] : [], // Auto-add to page if single-page document
          source: newSignatureSource,
        };
        setSignatures(prev => [...prev, newSig]);
        setActiveSignatureId(newSig.id);
        setIsAddingNew(false);
        setNewSignatureImage(null);
        setNewSignatureSource('draw');
      };
      img.src = croppedImage;
    } catch (error) {
      console.error('Error processing signature:', error);
    }
  };

  const handleCancelNewSignature = () => {
    setIsAddingNew(false);
    setNewSignatureImage(null);
    setNewSignatureSource('draw');
  };

  const handleRemoveSignature = (id: string) => {
    setSignatures(prev => prev.filter(s => s.id !== id));
    if (activeSignatureId === id) {
      setActiveSignatureId(signatures.find(s => s.id !== id)?.id || null);
    }
  };

  const handleRemoveBackground = async (id: string) => {
    const sig = signatures.find(s => s.id === id);
    if (!sig) return;

    setProcessingBgRemoval(id);
    try {
      const processed = await removeBackground(sig.image, {
        tolerance: 60,
        edgeSoftness: 0.5,
      });
      setSignatures(prev => prev.map(s =>
        s.id === id ? { ...s, image: processed } : s
      ));
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setProcessingBgRemoval(null);
    }
  };

  // Get size for a signature on current page
  const getSignatureSize = (sig: SignatureItem) => {
    // If current page has size, use it
    if (sig.pageSizes[previewPage]) {
      return sig.pageSizes[previewPage];
    }
    // Otherwise, use first page's size if set (auto-apply resize)
    const firstPageWithSize = sig.selectedPages.find(p => sig.pageSizes[p]);
    if (firstPageWithSize) {
      return sig.pageSizes[firstPageWithSize];
    }
    // Default size
    return getDefaultSize(sig.aspectRatio);
  };

  // Get position for a signature on current page
  const getSignaturePosition = (sig: SignatureItem) => {
    if (sig.pagePositions[previewPage]) {
      return sig.pagePositions[previewPage];
    }
    // Calculate default position based on signature size and index
    const size = getSignatureSize(sig);
    const sigIndex = signatures.findIndex(s => s.id === sig.id);
    return getDefaultPosition(size, sigIndex);
  };

  // Get client coordinates from mouse or touch event
  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Drag handling (works for both mouse and touch)
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, sigId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewRef.current) return;

    const sig = signatures.find(s => s.id === sigId);
    if (!sig) return;

    const { clientX, clientY } = getEventCoords(e);
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const pos = getSignaturePosition(sig);
    const size = getSignatureSize(sig);
    const sigRight = pos.x + size.width;
    const sigBottom = pos.y + size.height;

    setDraggedSignatureId(sigId);
    setActiveSignatureId(sigId);

    // Check if near resize corner (bigger hit area for touch)
    const hitArea = 'touches' in e ? 8 : 3;
    if (Math.abs(x - sigRight) < hitArea && Math.abs(y - sigBottom) < hitArea) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
  }, [signatures, previewPage]);

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current || (!isDragging && !isResizing) || !draggedSignatureId) return;
    e.preventDefault();

    const sig = signatures.find(s => s.id === draggedSignatureId);
    if (!sig) return;

    const { clientX, clientY } = getEventCoords(e);
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const pos = getSignaturePosition(sig);
    const size = getSignatureSize(sig);

    if (isDragging) {
      const newX = Math.max(0, Math.min(100 - size.width, x - size.width / 2));
      const newY = Math.max(0, Math.min(100 - size.height, y - size.height / 2));
      setSignatures(prev => prev.map(s => {
        if (s.id !== draggedSignatureId) return s;
        return {
          ...s,
          pagePositions: { ...s.pagePositions, [previewPage]: { x: newX, y: newY } }
        };
      }));
    } else if (isResizing) {
      const newWidth = Math.max(5, Math.min(50, x - pos.x));
      const newHeight = newWidth / sig.aspectRatio;
      if (newHeight <= 50 && pos.y + newHeight <= 100) {
        setSignatures(prev => prev.map(s => {
          if (s.id !== draggedSignatureId) return s;
          return {
            ...s,
            pageSizes: { ...s.pageSizes, [previewPage]: { width: newWidth, height: newHeight } }
          };
        }));
      }
    }
  }, [isDragging, isResizing, draggedSignatureId, signatures, previewPage]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedSignatureId(null);
  }, []);

  const handleSignAndDownload = async () => {
    if (files.length === 0 || signatures.length === 0) return;

    // Check if any signature has selected pages
    const hasSelectedPages = signatures.some(s => s.selectedPages.length > 0);
    if (!hasSelectedPages) {
      alert('Please select at least one page for a signature.');
      return;
    }

    const stats = await checkUsage();
    if (!stats.canPerform) {
      setUsageCount(stats.operationsToday);
      setShowLimitModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const signedPdf = await addSignaturesToPdf(files[0], signatures.map((sig, index) => {
        const defaultSize = getDefaultSize(sig.aspectRatio);
        return {
          signatureImage: sig.image,
          pages: sig.selectedPages,
          positions: sig.pagePositions,
          sizes: sig.pageSizes,
          defaultPosition: getDefaultPosition(defaultSize, index),
          defaultSize,
        };
      }));
      await recordUsage();

      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      downloadPdf(signedPdf, `oripdf_${timestamp}.pdf`);

      if (shouldShowShareModal()) {
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Error signing PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`mx-auto px-4 py-6 ${files.length > 0 ? 'max-w-7xl' : 'max-w-3xl'}`}>
      {/* UPLOAD STATE - Centered, clean */}
      {files.length === 0 ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Document</h1>
            <p className="text-gray-600">Add your signature to PDF, images, or Word documents</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {isConverting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                <p className="text-gray-600">Converting document to PDF...</p>
              </div>
            ) : (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                files={files}
                onRemoveFile={handleRemoveFile}
                multiple={false}
                maxSize={maxFileSize}
                onFileSizeError={handleFileSizeError}
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                  'application/msword': ['.doc'],
                }}
              />
            )}
            <p className="text-xs text-gray-400 text-center mt-3">
              Supported: {getAcceptedExtensions()}
            </p>
          </div>
        </>
      ) : (
        /* WORKSPACE STATE - Two column layout on desktop */
        <>
          {/* Compact file header */}
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{files[0].name}</p>
                <p className="text-xs text-gray-500">{pageCount} page{pageCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-sm text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-md hover:bg-gray-50"
            >
              Change file
            </button>
          </div>

          {/* Two-column workspace */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT SIDEBAR - Signatures Panel */}
            <div className="lg:w-80 flex-shrink-0 space-y-4">
              {/* Add Signature Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Signatures</h2>
                  {signatures.length > 0 && !isAddingNew && (
                    <button
                      onClick={handleAddSignature}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>

                {/* Existing signatures - compact list */}
                {signatures.length > 0 && !isAddingNew && (
                  <div className="space-y-2 mb-3">
                    {signatures.map((sig, index) => (
                      <div
                        key={sig.id}
                        onClick={() => setActiveSignatureId(sig.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          activeSignatureId === sig.id
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Signature preview */}
                          <div className="h-10 w-16 bg-white border border-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <img
                              src={sig.image}
                              alt={`Signature ${index + 1}`}
                              className="h-8 w-auto max-w-[56px] object-contain"
                            />
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-gray-900">
                                Signature {index + 1}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {sig.selectedPages.length === pageCount ? 'All pages' : `${sig.selectedPages.length} page${sig.selectedPages.length !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          {/* Delete */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSignature(sig.id); }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Action buttons - always visible */}
                        <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-200">
                          {/* Only show Clear background for uploaded signatures (draw already has transparent bg) */}
                          {sig.source !== 'draw' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveBackground(sig.id); }}
                              disabled={processingBgRemoval === sig.id}
                              className="text-[10px] px-2 py-1 rounded border bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50"
                            >
                              {processingBgRemoval === sig.id ? (
                                <span className="flex items-center justify-center gap-1">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  Processing
                                </span>
                              ) : (
                                'Clear background'
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isOnAll = sig.selectedPages.length === pageCount;
                              setSignatures(prev => prev.map(s => {
                                if (s.id !== sig.id) return s;
                                return {
                                  ...s,
                                  selectedPages: isOnAll ? [] : Array.from({ length: pageCount }, (_, i) => i + 1)
                                };
                              }));
                            }}
                            className={`text-[10px] px-2 py-1 rounded border bg-white border-gray-200 ${
                              sig.selectedPages.length === pageCount
                                ? 'text-red-500 hover:border-red-300'
                                : 'text-gray-600 hover:border-green-300 hover:text-green-600'
                            }`}
                          >
                            {sig.selectedPages.length === pageCount ? 'Remove from all pages' : 'Add to all pages'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new signature form */}
                {(isAddingNew || signatures.length === 0) && (
                  <div className="space-y-3">
                    {signatures.length === 0 && (
                      <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
                        Draw or upload your signature below
                      </p>
                    )}
                    <SignaturePad
                      signature={newSignatureImage}
                      onSignatureChange={handleNewSignatureChange}
                      onUseSavedSignature={handleUseSavedSignature}
                      usedSignatureUrls={signatures.map(s => s.image)}
                    />
                    <div className="flex gap-2 justify-end">
                      {signatures.length > 0 && (
                        <button
                          onClick={handleCancelNewSignature}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleConfirmNewSignature}
                        disabled={!newSignatureImage}
                        className={`px-3 py-1.5 text-xs bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                          newSignatureImage ? 'animate-bounce shadow-md shadow-primary-500/40' : ''
                        }`}
                      >
                        Add to document
                      </button>
                    </div>
                  </div>
                )}

                {/* Hint when signatures exist */}
                {signatures.length > 0 && !isAddingNew && (
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Drag signatures on preview to position
                  </p>
                )}
              </div>

              {/* Download Button - Desktop sidebar */}
              {signatures.length > 0 && signatures.some(s => s.selectedPages.length > 0) && (
                <Button
                  onClick={handleSignAndDownload}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Sign & Download
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* RIGHT CONTENT - Preview Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
                {/* Page thumbnails - NOW AT TOP */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Select a page to preview and position signatures
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                    {pageThumbnails.map((thumb, index) => {
                      const pageNum = index + 1;
                      const isPreviewing = previewPage === pageNum;
                      const signaturesOnPage = signatures.filter(s => s.selectedPages.includes(pageNum));

                      return (
                        <button
                          key={index}
                          onClick={() => setPreviewPage(pageNum)}
                          className={`relative aspect-[3/4] w-full rounded overflow-hidden border-2 transition-all ${
                            isPreviewing
                              ? 'border-primary-500 ring-2 ring-primary-200 scale-105'
                              : signaturesOnPage.length > 0
                              ? 'border-green-400 hover:scale-105'
                              : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                          }`}
                        >
                          <img
                            src={thumb}
                            alt={`Page ${pageNum}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] py-0.5 text-center">
                            {pageNum}
                          </div>
                          {signaturesOnPage.length > 0 && (
                            <div className="absolute top-0.5 right-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                              {signaturesOnPage.length}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {pageCount > 20 && (
                      <div className="aspect-[3/4] flex items-center justify-center text-xs text-gray-400 rounded border border-dashed border-gray-200">
                        +{pageCount - 20}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures on this page - toggle section */}
                {signatures.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Signatures on page {previewPage}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {signatures.map((sig, index) => {
                        const isOnPage = sig.selectedPages.includes(previewPage);
                        const isOnAllPages = sig.selectedPages.length === pageCount;
                        return (
                          <div key={sig.id} className={`flex items-center gap-1 rounded-md border text-xs transition-all ${
                            isOnPage
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-200'
                          }`}>
                            {/* Toggle this page */}
                            <button
                              onClick={() => {
                                setSignatures(prev => prev.map(s => {
                                  if (s.id !== sig.id) return s;
                                  return {
                                    ...s,
                                    selectedPages: isOnPage
                                      ? s.selectedPages.filter(p => p !== previewPage)
                                      : [...s.selectedPages, previewPage].sort((a, b) => a - b)
                                  };
                                }));
                                setActiveSignatureId(sig.id);
                              }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 ${
                                isOnPage ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isOnPage ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                              }`}>
                                {isOnPage && '✓'}
                              </span>
                              <img src={sig.image} alt="" className="h-4 w-auto max-w-[40px] object-contain" />
                              <span>Signature {index + 1}</span>
                            </button>
                            {/* Apply to all */}
                            <button
                              onClick={() => {
                                setSignatures(prev => prev.map(s => {
                                  if (s.id !== sig.id) return s;
                                  return {
                                    ...s,
                                    selectedPages: isOnAllPages
                                      ? []
                                      : Array.from({ length: pageCount }, (_, i) => i + 1)
                                  };
                                }));
                                setActiveSignatureId(sig.id);
                              }}
                              className={`px-2 py-1.5 border-l text-[10px] font-medium transition-colors ${
                                isOnAllPages
                                  ? 'border-green-300 text-green-600 hover:bg-green-100'
                                  : 'border-gray-200 text-gray-400 hover:text-primary-600 hover:bg-gray-100'
                              }`}
                              title={isOnAllPages ? 'Remove from all pages' : 'Apply to all pages'}
                            >
                              {isOnAllPages ? 'Remove from all pages' : 'Add to all pages'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview area */}
                <div
                  ref={previewRef}
                  className={`relative rounded-lg overflow-hidden mx-auto touch-none border border-gray-200 ${
                    isDragging || isResizing ? 'select-none' : ''
                  }`}
                  style={{
                    width: previewDimensions?.width ?? 'auto',
                    height: previewDimensions?.height ?? 'auto',
                    maxWidth: '100%',
                    backgroundColor: '#fff'
                  }}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                >
                  {isLoadingPreview ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : previewImage ? (
                    <img
                      src={previewImage}
                      alt="PDF Preview"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : null}


                  {/* Signature overlays - only show signatures that are on this page */}
                  {signatures
                    .filter(sig => sig.selectedPages.includes(previewPage))
                    .map((sig) => {
                      const pos = getSignaturePosition(sig);
                      const size = getSignatureSize(sig);
                      const isActive = sig.id === activeSignatureId;
                      const isBeingDragged = sig.id === draggedSignatureId;

                      return (
                        <div
                          key={sig.id}
                          onMouseDown={(e) => handleDragStart(e, sig.id)}
                          onTouchStart={(e) => handleDragStart(e, sig.id)}
                          className={`absolute border-2 rounded cursor-move transition-colors ${
                            isBeingDragged
                              ? 'border-primary-500 z-20 shadow-lg'
                              : isActive
                              ? 'border-primary-400 border-dashed z-10'
                              : 'border-gray-400/50 border-dashed z-0 hover:border-gray-500'
                          }`}
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            width: `${size.width}%`,
                            height: `${size.height}%`,
                          }}
                        >
                          <img
                            src={sig.image}
                            alt="Signature"
                            className="w-full h-full object-contain"
                            draggable={false}
                          />
                          {isActive && (
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary-500 rounded-full cursor-se-resize border-2 border-white shadow" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Mobile Download Button */}
              {signatures.length > 0 && signatures.some(s => s.selectedPages.length > 0) && (
                <div className="lg:hidden mt-4">
                  <Button
                    onClick={handleSignAndDownload}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Sign & Download
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
        toolName="Sign Document"
      />
    </div>
  );
}
