// PdfCanvasPreview.tsx
import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

type Props = {
  fileUrl: string;
  onReady?: () => void;
  className?: string;
};

const PdfCanvasPreview: React.FC<Props> = ({ fileUrl, onReady, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: any;

    (async () => {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;

      pdfDoc = await (pdfjsLib as any).getDocument({ url: fileUrl }).promise;
      if (cancelled) return;

      const page = await pdfDoc.getPage(1);
      if (cancelled) return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      // 부모 크기에 맞춰 contain
      const parent = canvas.parentElement!;
      const parentW = parent.clientWidth || 600;
      const parentH = parent.clientHeight || 400;

      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(parentW / viewport.width, parentH / viewport.height);
      const fitted = page.getViewport({ scale });

      canvas.width = Math.floor(fitted.width);
      canvas.height = Math.floor(fitted.height);

      await page.render({ canvasContext: ctx, viewport: fitted }).promise;

      onReady?.();
    })().catch(() => onReady?.());

    return () => {
      cancelled = true;
      try { pdfDoc?.destroy?.(); } catch {}
    };
  }, [fileUrl, onReady]);

  return (
    <div className={className} style={{ display: 'grid', placeItems: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </div>
  );
};

export default PdfCanvasPreview;
