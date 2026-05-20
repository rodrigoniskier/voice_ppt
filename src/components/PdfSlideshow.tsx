import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Inform pdfjs to use the worker from the CDN to avoid Vite bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfSlideshowProps {
  file: File;
  currentPage: number;
  onLoadSuccess: (numPages: number) => void;
}

export function PdfSlideshow({ file, currentPage, onLoadSuccess }: PdfSlideshowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the PDF once the file changes
  useEffect(() => {
    let active = true;

    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
        const doc = await loadingTask.promise;
        
        if (active) {
          setPdf(doc);
          onLoadSuccess(doc.numPages);
          setError(null);
        }
      } catch (err) {
        if (active) {
          console.error('Error loading PDF', err);
          setError('Não foi possível carregar o arquivo PDF.');
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (pdf) {
        pdf.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Render the current page
  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let active = true;

    const renderPage = async () => {
      if (!pdf || !canvasRef.current || !containerRef.current) return;

      try {
        const page = await pdf.getPage(currentPage);
        if (!active) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const container = containerRef.current;
        const padding = 32; // Some padding
        const containerWidth = container.clientWidth - padding * 2;
        const containerHeight = container.clientHeight - padding * 2;

        // Get unscaled viewport to calculate scale
        const unscaledViewport = page.getViewport({ scale: 1 });
        
        const scaleX = containerWidth / unscaledViewport.width;
        const scaleY = containerHeight / unscaledViewport.height;
        const scale = Math.min(scaleX, scaleY);
        
        // We can increase pixel density for sharper font rendering
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * pixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // Keep CSS dimension same as container scale
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page', err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdf, currentPage]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render by slightly mutating the state when the window resizes,
      // but to be clean, we'll just duplicate the render block. 
      // A better way is to move the render logic to a useCallback, but for simplicity,
      // we'll dispatch a custom event or use ResizeObserver.
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex h-full w-full flex-col items-center justify-center bg-gray-900 overflow-hidden"
    >
      <canvas 
        ref={canvasRef} 
        className="shadow-2xl rounded-sm transition-opacity duration-300"
      />
    </div>
  );
}
