import { useEffect, useState, useRef, useCallback } from 'react';
import {
  GestureRecognizer,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

export type GestureCommand = 'NEXT' | 'PREV' | null;

interface UseGestureCommandsProps {
  onCommand: (command: GestureCommand) => void;
}

export function useGestureCommands({ onCommand }: UseGestureCommandsProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasGestureSupport, setHasGestureSupport] = useState(true);
  const [gestureError, setGestureError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCommandTimeRef = useRef<number>(0);

  // Initialize Gesture Recognizer
  useEffect(() => {
    let active = true;
    const initializeRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (!active) return;
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
        });
        if (!active) return;
        recognizerRef.current = recognizer;
      } catch (err: any) {
        console.error('Error initializing Gesture Recognizer:', err);
        if (active) setGestureError('Erro ao carregar modelo de gestos.');
      }
    };
    initializeRecognizer();

    return () => {
      active = false;
      if (recognizerRef.current) {
        recognizerRef.current.close().catch(console.error);
      }
    };
  }, []);

  const predictWebcam = useCallback(() => {
    if (!videoRef.current || !recognizerRef.current) return;

    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const nowInMs = Date.now();
      try {
        const results = recognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);

        if (results.gestures.length > 0) {
          const categoryName = results.gestures[0][0].categoryName;

          if (nowInMs - lastCommandTimeRef.current > 1500) {
            if (categoryName === 'Open_Palm') {
              lastCommandTimeRef.current = nowInMs;
              onCommand('NEXT');
            } else if (categoryName === 'Closed_Fist') {
              lastCommandTimeRef.current = nowInMs;
              onCommand('PREV');
            }
          }
        }
      } catch (e) {
        console.error('Recognition error', e);
      }
    }

    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isCameraActive, onCommand]);

  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, predictWebcam]);

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const toggleGesture = useCallback(async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        setGestureError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasGestureSupport(false);
          setGestureError('Câmera não suportada neste navegador.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (!videoRef.current) {
          videoRef.current = document.createElement('video');
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
        }
        
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true);
        };

      } catch (err: any) {
        console.error('Camera error', err);
        setGestureError('Permissão de câmera negada ou dispositivo indisponível.');
        setIsCameraActive(false);
      }
    }
  }, [isCameraActive]);

  return {
    isCameraActive,
    hasGestureSupport,
    toggleGesture,
    gestureError,
    videoRef, // For potential debug overlay
  };
}
