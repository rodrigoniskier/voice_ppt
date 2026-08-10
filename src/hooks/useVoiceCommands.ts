import { useEffect, useState, useRef, useCallback } from 'react';

// Browser compatibility for SpeechRecognition
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export type VoiceCommand = 'NEXT' | 'PREV' | null;

interface UseVoiceCommandsProps {
  onCommand: (command: VoiceCommand) => void;
}

// Word-boundary matching prevents false triggers from words that merely
// contain a command as a substring, e.g. "atrasado" (delayed) contains
// "atras", and "ultrapassar" (to overtake) contains "passar".
const NEXT_PATTERN = /\b(próximo|proximo|próxima|proxima|passar|avançar|avancar|frente|segue)\b/i;
const PREV_PATTERN = /\b(voltar|anterior|trás|atrás|tras|atras)\b/i;

// How long to ignore further matches after a command fires, to avoid a
// single utterance re-triggering across successive interim results.
const COMMAND_COOLDOWN_MS = 1500;
// Delay before restarting recognition after it ends unexpectedly, to avoid
// a tight restart loop hammering the browser's speech service.
const RESTART_DELAY_MS = 250;

export function useVoiceCommands({ onCommand }: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callback in a ref so the recognition instance below can
  // be created once and never torn down just because the parent re-renders
  // with a new onCommand identity (which would otherwise silently drop the
  // listening session).
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    if (!SpeechRecognition) {
      setHasSupport(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true; // Use interim results for faster response
    recognition.maxAlternatives = 3;

    let lastCommandTime = 0;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];

      const now = Date.now();
      // Cooldown prevents rapid double-firing across interim updates of the
      // same utterance.
      if (now - lastCommandTime < COMMAND_COOLDOWN_MS) {
        return;
      }

      // Alternatives are ranked by the engine's own confidence. Evaluate
      // each one independently (instead of concatenating them into one
      // string) so a stray word in a low-confidence alternative can't bias
      // the match toward NEXT just because it's checked first.
      let command: VoiceCommand = null;
      for (let i = 0; i < result.length && !command; i++) {
        const transcript = result[i].transcript.toLowerCase();
        if (NEXT_PATTERN.test(transcript)) {
          command = 'NEXT';
        } else if (PREV_PATTERN.test(transcript)) {
          command = 'PREV';
        }
      }

      if (command) {
        lastCommandTime = now;
        onCommandRef.current(command);
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
      // Restart if we are supposed to be listening. A small delay avoids a
      // tight restart loop if the engine keeps ending immediately (e.g.
      // repeated 'no-speech' errors), which could otherwise get throttled
      // by the browser and leave voice control silently unresponsive.
      if (shouldListenRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Error restarting recognition', err);
            }
          }
        }, RESTART_DELAY_MS);
      }
    };

    return () => {
      shouldListenRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
