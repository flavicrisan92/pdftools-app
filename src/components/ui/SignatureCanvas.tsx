import { useRef, useEffect, useCallback, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { Trash2, Undo2 } from 'lucide-react';

const PEN_COLORS = [
  { color: '#000000', name: 'Black' },
  { color: '#1e40af', name: 'Blue' },
  { color: '#dc2626', name: 'Red' },
  { color: '#166534', name: 'Green' },
];

interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void;
  initialPenColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function SignatureCanvas({
  onChange,
  initialPenColor = '#000000',
  backgroundColor = 'rgba(255, 255, 255, 0)',
  className = '',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const onChangeRef = useRef(onChange);
  const [penColor, setPenColor] = useState(initialPenColor);
  const [strokeWidth, setStrokeWidth] = useState(2); // 1-5 range
  const [isInitialized, setIsInitialized] = useState(false);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize signature pad - only once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized) return;

    // Set canvas size to match display size
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    signaturePadRef.current = new SignaturePadLib(canvas, {
      penColor,
      backgroundColor,
      minWidth: strokeWidth * 0.5,
      maxWidth: strokeWidth * 1.5,
    });

    // Listen for end of stroke
    signaturePadRef.current.addEventListener('endStroke', () => {
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        onChangeRef.current(signaturePadRef.current.toDataURL('image/png'));
      }
    });

    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      if (!signaturePadRef.current) return;
      const data = signaturePadRef.current.toData();
      const newRatio = Math.max(window.devicePixelRatio || 1, 1);
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * newRatio;
      canvas.height = newRect.height * newRatio;
      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(newRatio, newRatio);
      }
      signaturePadRef.current.clear();
      signaturePadRef.current.fromData(data);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pen color without clearing canvas
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = penColor;
    }
  }, [penColor]);

  // Update stroke width without clearing canvas
  useEffect(() => {
    if (signaturePadRef.current) {
      // More dramatic difference: thin (0.5-1.5) to thick (4-12)
      signaturePadRef.current.minWidth = strokeWidth * 0.5;
      signaturePadRef.current.maxWidth = strokeWidth * 1.5;
    }
  }, [strokeWidth]);

  const handleClear = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      onChangeRef.current(null);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toData();
      if (data.length > 0) {
        data.pop();
        signaturePadRef.current.fromData(data);
        if (data.length === 0) {
          onChangeRef.current(null);
        } else {
          onChangeRef.current(signaturePadRef.current.toDataURL('image/png'));
        }
      }
    }
  }, []);

  const isCustomColor = !PEN_COLORS.some(c => c.color === penColor);

  return (
    <div className={`${className}`}>
      {/* Color picker, stroke width & actions - above canvas */}
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Color:</span>
            <div className="flex gap-1 items-center">
              {PEN_COLORS.map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPenColor(color)}
                  className={`w-4 h-4 rounded-full transition-all ${
                    penColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
              {/* Custom color picker */}
              <label
                className={`w-4 h-4 rounded-full cursor-pointer transition-all overflow-hidden border border-gray-300 ${
                  isCustomColor ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
                }`}
                title="Custom color"
                style={{ background: isCustomColor ? penColor : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
              >
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="opacity-0 w-0 h-0"
                />
              </label>
            </div>
          </div>
          {/* Stroke width with visual preview */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Thickness:</span>
            <input
              type="range"
              min="1"
              max="8"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20 h-1 accent-gray-600"
            />
            {/* Visual preview of stroke thickness */}
            <div
              className="rounded-full"
              style={{
                width: `${Math.max(4, strokeWidth * 2.5)}px`,
                height: `${Math.max(4, strokeWidth * 2.5)}px`,
                backgroundColor: penColor,
                minWidth: '4px',
                minHeight: '4px'
              }}
              title={`Thickness: ${strokeWidth}`}
            />
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair touch-none"
        style={{ backgroundColor: '#ffffff' }}
      />
    </div>
  );
}
