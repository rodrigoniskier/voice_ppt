import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadCloud, Mic, MicOff, Maximize, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVoiceCommands, VoiceCommand } from './hooks/useVoiceCommands';
import { PdfSlideshow } from './components/PdfSlideshow';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCommand = useCallback((command: VoiceCommand) => {
    if (command === 'NEXT') {
      setCurrentPage((prev) => (numPages ? Math.min(prev + 1, numPages) : prev + 1));
    } else if (command === 'PREV') {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  }, [numPages]);

  const { isListening, hasSupport, toggleListening, error: voiceError } = useVoiceCommands({
    onCommand: handleCommand,
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setCurrentPage(1);
      } else {
        alert('Por favor, carregue um arquivo PDF.');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleCommand('NEXT');
      } else if (e.key === 'ArrowLeft') {
        handleCommand('PREV');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCommand]);

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else if (document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  if (!hasSupport) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans p-6 text-center">
        <div className="max-w-md space-y-4">
          <MicOff className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-semibold">Navegador não suportado</h1>
          <p className="text-zinc-400">
            A API de Reconhecimento de Voz não é suportada neste navegador. Por favor, utilize o Google Chrome ou Edge M114+.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex h-screen w-full flex-col bg-zinc-950 text-white font-sans overflow-hidden transition-colors duration-500",
        isFullScreen ? "bg-black" : ""
      )}
    >
      {!file ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center rounded-full bg-blue-500/10 p-4">
                <Mic className="h-8 w-8 text-blue-500" />
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-zinc-100">
                Apresentador por Voz
              </h1>
              <p className="text-zinc-400 max-w-md mx-auto">
                Carregue seu PDF e utilize comandos de voz como <strong className="text-white font-medium">"Próximo"</strong> e <strong className="text-white font-medium">"Voltar"</strong> para controlar a apresentação de forma livre.
              </p>
            </div>

            <label 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden relative"
            >
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileInput} 
                className="hidden" 
              />
              <UploadCloud className="h-10 w-10 text-zinc-500 group-hover:text-blue-400 transition-colors mb-4" />
              <p className="text-sm font-medium text-zinc-300">
                Clique para enviar ou arraste o PDF aqui
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Suporta múltiplos comandos em português
              </p>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
            </label>
          </motion.div>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col h-full bg-zinc-950">
          
          {/* Top Bar for Windowed Mode */}
          {!isFullScreen && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3 text-sm text-zinc-400 truncate max-w-[50%]">
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="truncate font-medium text-zinc-300">{file.name}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setFile(null)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Trocar PDF
                </button>
              </div>
            </div>
          )}

          {/* Presentation Area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
            <PdfSlideshow 
              file={file} 
              currentPage={currentPage}
              onLoadSuccess={setNumPages} 
            />
          </div>

          {/* Floating Controls Structure */}
          <AnimatePresence>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-2 rounded-full shadow-2xl transition-opacity duration-300",
                isFullScreen ? "opacity-20 hover:opacity-100" : "opacity-100"
              )}
            >
              {/* Pagination controls */}
              <div className="flex items-center space-x-1 pr-4 border-r border-zinc-800">
                <button 
                  onClick={() => handleCommand('PREV')}
                  disabled={currentPage <= 1}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-xs font-medium text-zinc-300 font-mono w-16 text-center tabular-nums">
                  {currentPage} <span className="text-zinc-600">/</span> {numPages || '-'}
                </div>
                <button 
                  onClick={() => handleCommand('NEXT')}
                  disabled={!!numPages && currentPage >= numPages}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Voice Control */}
              <div className="flex items-center px-2">
                <button
                  onClick={toggleListening}
                  className={cn(
                    "flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                    isListening 
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  )}
                >
                  {isListening ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Ouvindo...</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-4 w-4" />
                      <span>Voz Desligada</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <div className="pl-4 border-l border-zinc-800 flex items-center pr-2">
                 <button
                  onClick={toggleFullScreen}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                  aria-label="Tela Inteira"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Voice Error Toast */}
          <AnimatePresence>
            {voiceError && (
              <motion.div
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="absolute top-6 left-1/2 z-50 bg-red-500 text-white text-sm px-4 py-2 rounded-full shadow-lg"
              >
                {voiceError}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}

