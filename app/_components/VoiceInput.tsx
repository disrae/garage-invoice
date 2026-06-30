"use client";

import { useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

type Props = {
  onSubmit: (text: string) => void;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
};

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 10.5a6.5 6.5 0 1 0 13 0" />
      <path d="M12 17v4" />
      <path d="M9 21.5h6" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

export function VoiceInput({
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
}: Props) {
  const [text, setText] = useState("");
  const speech = useSpeechRecognition(setText);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !disabled;

  const updateText = (value: string) => {
    setText(value);
  };

  const startHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || speech.listening) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // optional
    }
    setText("");
    speech.start();
  };

  const endHold = () => {
    if (!speech.listening) return;
    speech.stop();
    // Auto-submit when voice produced text.
    setTimeout(() => {
      setText((current) => {
        const value = current.trim();
        if (value && !disabled) onSubmit(value);
        return value && !disabled ? "" : current;
      });
    }, 300);
  };

  const submit = () => {
    if (!canSubmit) return;
    speech.stop();
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {speech.supported && (
        <div className="flex flex-col items-center gap-3 select-none">
          <div className="relative flex h-32 w-32 items-center justify-center">
            {speech.listening && (
              <>
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full bg-red-500/30"
                />
                <span
                  aria-hidden
                  className="absolute inset-2 rounded-full bg-red-500/20 animate-pulse"
                />
              </>
            )}
            <button
              type="button"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
              disabled={disabled}
              aria-label="Hold to speak"
              aria-pressed={speech.listening}
              style={{ touchAction: "none" }}
              className={`relative flex h-28 w-28 touch-none items-center justify-center rounded-full shadow-lg transition-transform duration-150 disabled:opacity-40 ${
                speech.listening
                  ? "scale-110 bg-red-600 text-white shadow-red-500/40"
                  : "bg-zinc-900 text-white hover:bg-zinc-700 hover:shadow-xl active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              }`}
            >
              {speech.listening ? (
                <StopIcon className="h-10 w-10 animate-pulse" />
              ) : (
                <MicIcon className="h-11 w-11" />
              )}
            </button>
          </div>
          <p
            className={`text-base font-medium ${
              speech.listening
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {speech.listening ? "Listening… release when done" : "Hold to speak"}
          </p>
        </div>
      )}

      {speech.statusHint && (
        <p className="w-full whitespace-pre-line rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          {speech.statusHint}
        </p>
      )}

      <div className="w-full">
        <label
          htmlFor="job-input"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Job details
        </label>
        <textarea
          id="job-input"
          value={text}
          onChange={(e) => updateText(e.target.value)}
          onInput={(e) => updateText(e.currentTarget.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          enterKeyHint="done"
          className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-base text-zinc-900 outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        className={`w-full rounded-full px-6 py-3.5 text-base font-semibold transition-colors ${
          canSubmit
            ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            : "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
        }`}
      >
        {submitLabel}
      </button>

      {!canSubmit && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Type job details above to enable this button.
        </p>
      )}
    </div>
  );
}
