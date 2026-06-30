"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export type UseSpeech = {
  supported: boolean;
  listening: boolean;
  statusHint: string | null;
  start: () => void;
  stop: () => void;
};

/** Live transcript via the browser's built-in Web Speech API (free, no server). */
export function useSpeechRecognition(
  onTranscript: (text: string) => void,
): UseSpeech {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const wantListeningRef = useRef(false);
  const callbackRef = useRef(onTranscript);

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const secure =
      typeof window !== "undefined" &&
      (window.isSecureContext || window.location.hostname === "localhost");
    const hasSpeech = getRecognitionCtor() !== null;
    setSupported(hasSpeech);

    if (!secure) {
      setStatusHint("Voice needs HTTPS. Use an https:// link (e.g. ngrok).");
    } else if (!hasSpeech) {
      setStatusHint("Voice not available here — type your job below.");
    }
  }, []);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-CA";
    recognition.continuous = !isIOS();
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalRef.current += text;
        else interim += text;
      }
      callbackRef.current((finalRef.current + interim).trimStart());
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setStatusHint("Microphone blocked. Allow mic access in Settings.");
      }
      if (!wantListeningRef.current) setListening(false);
    };

    recognition.onend = () => {
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through
        }
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      wantListeningRef.current = false;
      recognition.stop();
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    finalRef.current = "";
    wantListeningRef.current = true;
    try {
      recognition.start();
      setListening(true);
      setStatusHint(null);
    } catch {
      setStatusHint("Could not start dictation. Check microphone permission.");
    }
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, statusHint, start, stop };
}
