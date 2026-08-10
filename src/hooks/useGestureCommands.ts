import { useEffect, useState, useRef, useCallback } from 'react';
import {
  GestureRecognizer,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

export type GestureCommand = 'NEXT' | 'PREV' | null;

interface UseGestureCommandsProps {
  onCommand: (command: GestureCommand) => void;
}

// How long to ignore further matches after a command fires.
const COMMAND_COOLDOWN_MS = 1500;
// Number of consecutive frames the same gesture must be recognized before it
// is accepted as a command. A single misclassified frame is common (hand
// mid-transition, motion blur) - requiring a short streak filters that noise
// out while adding only ~2 frames (well under 100ms) of latency.
const REQUIRED_CONSECUTIVE_FRAMES = 3;
// Minimum classifier confidence for a canned gesture to be considered at
// all; results below this are rejected by the recognizer itself.
const GESTURE_SCORE_THRESHOLD = 0.6;

export function useGestureCommands({ onCommand }: UseGestureCommandsProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasGestureSupport, setHasGestureSupport] = useState(true);
  const [gestureError, setGestureError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCommandTimeRef = useRef<number>(0);
  const pendingGestureRef = useRef<{ name: string; count: number }>({ name: '', count: 0 });

  // Keep the latest callback in a ref so the prediction loop below doesn't
  // need to be torn down and rebuilt whenever the parent passes a new
  // onCommand identity.
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  // Initialize Gesture Recognizer
  useEffect(() => {
    let active = true;

    const createRecognizer = (delegate: 'GPU' | 'CPU') =>
      FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      ).then((vision) =>
        GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate,
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          cannedGesturesClassifierOptions: {
            scoreThreshold: GESTURE_SCORE_THRESHOLD,
          },
        })
      );

    const initializeRecognizer = async () => {
      try {
        const recognizer = await createRecognizer('GPU');
        if (!active) return;
        recognizerRef.current = recognizer;
      } catch (err: any) {
        console.error('Error initializing Gesture Recognizer on GPU, retrying on CPU:', err);
        try {
          const recognizer = await createRecognizer('CPU');
          if (!active) return;
          recognizerRef.current = recognizer;
        } catch (cpuErr: any) {
          console.error('Error initializing Gesture Recognizer:', cpuErr);
          if (active) setGestureError('Erro ao carregar modelo de gestos.');
        }
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

        const categoryName = results.gestures.length > 0 ? results.gestures[0][0].categoryName : '';

        // Require the same gesture on several consecutive frames before
        // treating it as intentional input.
        const pending = pendingGestureRef.current;
        if (categoryName && categoryName === pending.name) {
          pending.count += 1;
        } else {
          pending.name = categoryName;
          pending.count = categoryName ? 1 : 0;
        }

        if (
          pending.count >= REQUIRED_CONSECUTIVE_FRAMES &&
          nowInMs - lastCommandTimeRef.current > COMMAND_COOLDOWN_MS
        ) {
          if (categoryName === 'Open_Palm') {
            lastCommandTimeRef.current = nowInMs;
            onCommandRef.current('NEXT');
          } else if (categoryName === 'Closed_Fist') {
            lastCommandTimeRef.current = nowInMs;
            onCommandRef.current('PREV');
          }
        }
      } catch (e) {
        console.error('Recognition error', e);
      }
    }

    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isCameraActive]);

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

        // A higher resolution gives the hand-landmark model more detail to
        // work with, which noticeably improves detection reliability when
        // presenting from typical distances (arm's length or more) instead
        // of right up against the webcam.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });

        if (!videoRef.current) {
          videoRef.current = document.createElement('video');
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
        }

        pendingGestureRef.current = { name: '', count: 0 };
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
