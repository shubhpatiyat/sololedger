import { useState, useRef, useEffect, useCallback } from 'react';

type Nullable<T> = T | null;

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionExt extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface UseSpeechRecognitionProps {
  onTextUpdate: (text: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionExt;
    webkitSpeechRecognition: new () => SpeechRecognitionExt;
  }
}

const TOTAL_BARS = 120;
const SAMPLE_INTERVAL_MS = 60;

export const useSpeechRecognition = ({ onTextUpdate, inputRef }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | null>(null);
  const [waveform, setWaveform] = useState<number[]>(Array(TOTAL_BARS).fill(0));
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<Nullable<SpeechRecognitionExt>>(null);
  const streamRef = useRef<Nullable<MediaStream>>(null);
  const audioContextRef = useRef<Nullable<AudioContext>>(null);
  const analyserRef = useRef<Nullable<AnalyserNode>>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const pushTimerRef = useRef<number | null>(null);

  const initialInputValRef = useRef<string>("");

  // Detect speech API support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const checkMicrophoneAvailability = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicAvailable(false);
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some((d) => d.kind === "audioinput");

      setMicAvailable(hasMic);
      return hasMic;
    } catch {
      setMicAvailable(false);
      return false;
    }
  }, []);

  const checkMicrophonePermission = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      return true;
    } catch {
      setMicPermission("denied");
      return false;
    }
  }, []);

  const startVolumeDetection = useCallback((stream: MediaStream) => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContextRef.current = new AC();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;

    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new ArrayBuffer(bufferLength);
    dataArrayRef.current = new Uint8Array(buffer);

    pushTimerRef.current = window.setInterval(() => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = (dataArrayRef.current[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);

      const level = Math.min(1, Math.max(0, rms * 4));

      setWaveform((prev) => [...prev.slice(1), level]);
    }, SAMPLE_INTERVAL_MS);
  }, []);

  // Stop everything
  const stopAll = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }

    recognitionRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;

    audioContextRef.current?.close().catch(() => {
      // ignore close errors
    });
    audioContextRef.current = null;

    if (pushTimerRef.current) clearInterval(pushTimerRef.current);
    pushTimerRef.current = null;

    analyserRef.current = null;
    dataArrayRef.current = null;

    setWaveform(Array(TOTAL_BARS).fill(0));
    setTranscript("");
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!speechSupported || isListening) return false;

    if (!(await checkMicrophoneAvailability())) return false;
    if (!(await checkMicrophonePermission())) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      startVolumeDetection(stream);

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return false;

      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      initialInputValRef.current = inputRef.current?.value || "";

      setTranscript("");

      recognition.onstart = () => {
        setIsListening(true);
        setIsSpeaking(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }

        setIsSpeaking(true);
        setTranscript(text); // DO NOT update input yet
      };

      recognition.onerror = () => {
        stopAll();
      };

      recognition.onend = () => {
        stopAll();
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch {
      // permission denied or other errors
      stopAll();
      return false;
    }
  }, [
    speechSupported,
    isListening,
    checkMicrophoneAvailability,
    checkMicrophonePermission,
    startVolumeDetection,
    stopAll,
    inputRef
  ]);

  const toggleSpeechRecognition = useCallback(async () => {
    if (isListening) {
      stopAll();
      return;
    }
    await startListening();
  }, [isListening, startListening, stopAll]);

  const acceptRecording = useCallback(() => {
    const base = initialInputValRef.current;
    const finalText = transcript.trim();

    onTextUpdate(base ? base + " " + finalText : finalText);

    initialInputValRef.current = "";
    setTranscript("");

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }

    stopAll();
  }, [transcript, onTextUpdate, stopAll]);

  const cancelRecording = useCallback(() => {
    onTextUpdate(""); // CLEAR INPUT COMPLETELY

    initialInputValRef.current = "";
    setTranscript("");

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors
    }

    stopAll();
  }, [onTextUpdate, stopAll]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore stop errors
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pushTimerRef.current) clearInterval(pushTimerRef.current);
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    speechSupported,
    micAvailable,
    micPermission,
    waveform,
    transcript,
    toggleSpeechRecognition,
    acceptRecording,
    cancelRecording,
  };
};
