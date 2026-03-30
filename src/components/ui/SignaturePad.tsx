import { useState, useRef, useCallback, useEffect } from 'react';
import { SignatureCanvas } from './SignatureCanvas';
import { removeBackground } from '../../lib/image/removeBackground';
import { Pencil, Upload, Bookmark, Loader2, Wand2, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type TabType = 'draw' | 'upload' | 'saved';

interface SavedSignature {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
}

interface SignaturePadProps {
  onSignatureChange: (signature: string | null, source: 'draw' | 'upload' | 'saved') => void;
  onUseSavedSignature?: (signature: string) => void;
  signature: string | null;
  usedSignatureUrls?: string[]; // URLs of signatures already added to document
}

export function SignaturePad({ onSignatureChange, onUseSavedSignature, signature, usedSignatureUrls = [] }: SignaturePadProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(user ? 'saved' : 'draw');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedSaved, setLoadedSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate next signature number based on existing names
  const getNextSignatureNumber = () => {
    const existingNumbers = savedSignatures
      .map(s => {
        const match = s.name.match(/^Signature (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    return existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  };

  // Load saved signatures when switching to saved tab
  const loadSavedSignatures = useCallback(async () => {
    if (!user || loadedSaved) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Support both old format (signatureUrl) and new format (signatures array)
        if (data.signatures && Array.isArray(data.signatures)) {
          setSavedSignatures(data.signatures);
        } else if (data.signatureUrl) {
          // Migrate old format to new format
          const migrated: SavedSignature = {
            id: 'migrated-' + Date.now(),
            name: 'Signature 1',
            imageUrl: data.signatureUrl,
            createdAt: Date.now(),
          };
          setSavedSignatures([migrated]);
        }
      }
      setLoadedSaved(true);
    } catch (error) {
      console.error('Error loading saved signatures:', error);
    }
  }, [user, loadedSaved]);

  // Load saved signatures on mount if user is logged in
  useEffect(() => {
    if (user) {
      loadSavedSignatures();
    }
  }, [user, loadSavedSignatures]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'saved' && user) {
      loadSavedSignatures();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSignatureChange(dataUrl, 'upload');
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveBackground = async () => {
    if (!signature) return;

    setIsProcessing(true);
    try {
      const processed = await removeBackground(signature, {
        tolerance: 60,
        edgeSoftness: 0.5,
      });
      onSignatureChange(processed, activeTab);
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!user || !signature) return;

    setIsSaving(true);
    try {
      // Auto-generate name if not provided
      const autoName = signatureName.trim() || `Signature ${getNextSignatureNumber()}`;

      const newSignature: SavedSignature = {
        id: 'sig-' + Date.now(),
        name: autoName,
        imageUrl: signature,
        createdAt: Date.now(),
      };

      await updateDoc(doc(db, 'users', user.uid), {
        signatures: arrayUnion(newSignature),
        updatedAt: new Date(),
      });

      setSavedSignatures(prev => [...prev, newSignature]);
      setSignatureName(''); // Reset input

      // Also add the signature to the document
      if (onUseSavedSignature) {
        onUseSavedSignature(signature);
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error saving signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSignature = async (sig: SavedSignature) => {
    if (!user) return;

    setDeletingId(sig.id);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        signatures: arrayRemove(sig),
        updatedAt: new Date(),
      });

      setSavedSignatures(prev => prev.filter(s => s.id !== sig.id));
    } catch (error) {
      console.error('Error deleting signature:', error);
      alert('Error deleting signature. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseSaved = (imageUrl: string) => {
    if (onUseSavedSignature) {
      // Directly add the saved signature
      onUseSavedSignature(imageUrl);
    } else {
      // Fallback to old behavior
      onSignatureChange(imageUrl, 'saved');
    }
  };

  const tabs = [
    { id: 'draw' as TabType, label: 'Draw', icon: Pencil },
    { id: 'upload' as TabType, label: 'Upload', icon: Upload },
    ...(user ? [{ id: 'saved' as TabType, label: 'Saved', icon: Bookmark }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'draw' && (
          <SignatureCanvas onChange={(img) => onSignatureChange(img, 'draw')} />
        )}

        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload signature image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or GIF</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {activeTab === 'saved' && user && (
          <div className="space-y-3">
            {!loadedSaved ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : savedSignatures.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {savedSignatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    {/* Signature preview */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-16 bg-white border border-gray-200 rounded flex items-center justify-center">
                        <img
                          src={sig.imageUrl}
                          alt={sig.name}
                          className="max-h-14 max-w-20 object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 text-center mt-1 truncate w-24">
                        {sig.name}
                      </p>
                    </div>

                    {/* Use button */}
                    {usedSignatureUrls.includes(sig.imageUrl) ? (
                      <span className="flex-1 py-2 px-3 bg-gray-200 text-gray-500 text-sm rounded-lg text-center">
                        Already added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUseSaved(sig.imageUrl)}
                        className="flex-1 py-2 px-3 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Use This Signature
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSignature(sig)}
                      disabled={deletingId === sig.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete signature"
                    >
                      {deletingId === sig.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No saved signatures yet</p>
                <p className="text-sm">Draw or upload a signature and save it</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions - only show for upload tab (draw already has transparent bg) */}
      {signature && activeTab === 'upload' && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRemoveBackground}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              Clear background
            </button>
          </div>

          {user && (
            <div className="space-y-2">
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={`Signature ${getNextSignatureNumber()}`}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={handleSaveSignature}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save to profile and add to document
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save button for draw tab */}
      {signature && activeTab === 'draw' && user && (
        <div className="space-y-2">
          <input
            type="text"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder={`Signature ${getNextSignatureNumber()}`}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleSaveSignature}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save to profile and add to document
          </button>
        </div>
      )}
    </div>
  );
}
