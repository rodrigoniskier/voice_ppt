import { useEffect, useState, useRef, useCallback } from 'react';

// Browser compatibility for SpeechRecognition
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceCommand = 'NEXT' | 'PREV' | null;

interface UseVoiceCommandsProps {
  onCommand: (command: VoiceCommand) => void;
}

export function useVoiceCommands({ onCommand }: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    if (!SpeechRecognition) {
      setHasSupport(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();
      console.log('Voice recognized:', transcript);

      const isNext = /(próximo|próxima|passar|avançar|frente)/i.test(transcript);
      const isPrev = /(voltar|anterior|trás|atrás)/i.test(transcript);

      if (isNext) {
        onCommand('NEXT');
      } else if (isPrev) {
        onCommand('PREV');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError('Permissão de microfone negada.');
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if we are supposed to be listening
      if (shouldListenRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Error restarting recognition', err);
        }
      }
    };

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
    } else {
      setError(null);
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition', err);
      }
    }
  }, [isListening]);

  return {
    isListening,
    hasSupport,
    toggleListening,
    error,
  };
}
