"use client";

import { Bot } from "lucide-react";
import { VoiceInput } from "./VoiceInput";

type Props = {
  question: string;
  options: string[];
  onAnswer: (text: string) => void;
  disabled?: boolean;
};

export function QuestionCard({ question, options, onAnswer, disabled }: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        >
          <Bot className="h-5 w-5" />
        </div>
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {question}
        </p>
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAnswer(option)}
              disabled={disabled}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-300"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <VoiceInput
          onSubmit={onAnswer}
          placeholder="Or answer in your own words…"
          submitLabel="Send"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
