"use client";

import { useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

type Props = {
  onSubmit: (text: string) => void;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
};

export function VoiceInput({
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
}: Props) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  // Live transcript flows straight into the editable box.
  const speech = useSpeechRecognition(setText);

  const showTextarea = typing || !speech.supported;
  const hasText = text.trim().length > 0;

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      setText("");
      setTyping(false);
      speech.start();
    }
  };

  const submit = () => {
    if (!hasText || disabled) return;
    speech.stop();
    onSubmit(text.trim());
    setText("");
    setTyping(false);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Mic is the dominant call to action */}
      {speech.supported && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-28 w-28 items-center justify-center">
            {speech.listening && (
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-red-500/30"
              />
            )}
            <button
              type="button"
              onClick={toggleMic}
              disabled={disabled}
              aria-label={
                speech.listening ? "Stop recording" : "Start recording"
              }
              className={`relative flex h-28 w-28 items-center justify-center rounded-full text-5xl shadow-lg transition-all active:scale-95 disabled:opacity-40 ${
                speech.listening
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 text-white hover:bg-zinc-700 hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              }`}
            >
              {speech.listening ? "■" : "🎤"}
            </button>
          </div>
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            {speech.listening ? "Listening… tap to stop" : "Tap to speak"}
          </p>
        </div>
      )}

      {/* Live transcript / editable backup */}
      {(hasText || showTextarea) && (
        <div className="w-full">
          {showTextarea ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder={placeholder}
              rows={3}
              disabled={disabled}
              autoFocus
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-base text-zinc-900 outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
            />
          ) : (
            <p className="rounded-lg bg-zinc-100 p-3 text-center text-base text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
              {text}
            </p>
          )}
        </div>
      )}

      {/* Primary action appears once there's something to send */}
      {hasText && (
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="w-full rounded-full bg-zinc-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {submitLabel}
        </button>
      )}

      {/* Typing is a quiet backup */}
      {speech.supported && (
        <button
          type="button"
          onClick={() => {
            speech.stop();
            setTyping((t) => !t);
          }}
          disabled={disabled}
          className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline disabled:opacity-40 dark:hover:text-zinc-300"
        >
          {showTextarea ? "Use voice instead" : "Type instead"}
        </button>
      )}
    </div>
  );
}
