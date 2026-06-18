'use client';

import React, { useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';

export interface DrawingCanvasRef {
  getSvgOrImage: () => Promise<string | null>;
  isEmpty: () => boolean;
}

interface DrawingCanvasProps {
  initialData?: string;
  readOnly?: boolean;
  className?: string;
  canvasRef?: any;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ initialData, readOnly = false, className, canvasRef }, ref) => {
    const resolvedRef = canvasRef || ref;
    const [editor, setEditor] = useState<Editor | null>(null);

    const handleMount = useCallback(
      (app: Editor) => {
        setEditor(app);
        
        // If we have initialData, we could load it here.
        // For simplicity, we assume initialData is an image URL in readOnly mode.
        // In a full implementation, you'd load the tldraw store.
        if (initialData && readOnly) {
           // We'll just display it as an image overlay or load the snapshot
        }
      },
      [initialData, readOnly]
    );

    useImperativeHandle(resolvedRef, () => ({
      getSvgOrImage: async () => {
        if (!editor) return null;
        
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size === 0) return null;

        try {
          const result = await editor.toImageDataUrl(Array.from(shapeIds), { background: true, padding: 16 });
          if (!result?.url) return null;
          return result.url;
        } catch (err) {
          console.error('Failed to export drawing', err);
          return null;
        }
      },
      isEmpty: () => {
        if (!editor) return true;
        return editor.getCurrentPageShapeIds().size === 0;
      }
    }));

    // If readOnly and we have a data URL/image URL, just render the image
    if (readOnly && initialData) {
      return (
        <div className={`border rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center ${className || 'h-[400px]'}`}>
          <img src={initialData} alt="Drawing answer" className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    return (
      <div className={`relative border rounded-xl overflow-hidden ${className || 'h-[500px]'}`}>
        <Tldraw
          onMount={handleMount}
          hideUi={readOnly}
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
