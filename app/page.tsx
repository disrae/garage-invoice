"use client";

import { useState } from "react";
import type { ChatMessage, ChatResponse } from "@/lib/chat";
import type { InvoiceDraft } from "@/lib/invoice";
import { SHOP } from "@/lib/invoice";
import { InvoiceDocument } from "./_components/InvoiceDocument";
import { QuestionCard } from "./_components/QuestionCard";
import { VoiceInput } from "./_components/VoiceInput";

type Phase = "intake" | "loading" | "question" | "invoice" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [question, setQuestion] = useState<{
    question: string;
    options: string[];
  } | null>(null);
  const [pendingToolUseId, setPendingToolUseId] = useState<string | null>(null);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function callChat(
    nextMessages: ChatMessage[],
    askedSoFar: number,
  ): Promise<void> {
    setMessages(nextMessages);
    setPhase("loading");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          questionCount: askedSoFar,
        }),
      });
      const data = (await res.json()) as ChatResponse;
      handleResponse(data, nextMessages, askedSoFar);
    } catch {
      setErrorMsg("Couldn't reach the server. Check your connection.");
      setPhase("error");
    }
  }

  function handleResponse(
    data: ChatResponse,
    currentMessages: ChatMessage[],
    askedSoFar: number,
  ) {
    if (data.kind === "error") {
      setErrorMsg(data.message);
      setPhase("error");
      return;
    }
    if (data.kind === "question") {
      // Record the assistant's tool_use turn so the next call stays valid.
      setMessages([
        ...currentMessages,
        { role: "assistant", content: data.assistantContent },
      ]);
      setPendingToolUseId(data.toolUseId);
      setQuestion({ question: data.question, options: data.options });
      setQuestionCount(askedSoFar + 1);
      setPhase("question");
      return;
    }
    // draft
    setDraft(data.draft);
    setPhase("invoice");
  }

  function handleIntake(text: string) {
    void callChat([{ role: "user", content: text }], 0);
  }

  function handleAnswer(text: string) {
    if (!pendingToolUseId) return;
    const answered: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: pendingToolUseId,
            content: text,
          },
        ],
      },
    ];
    setQuestion(null);
    void callChat(answered, questionCount);
  }

  function reset() {
    setPhase("intake");
    setMessages([]);
    setQuestionCount(0);
    setQuestion(null);
    setPendingToolUseId(null);
    setDraft(null);
    setErrorMsg("");
  }

  if (phase === "invoice" && draft) {
    return (
      <main className="min-h-full bg-zinc-100 px-4 py-8 dark:bg-black">
        <InvoiceDocument draft={draft} onChange={setDraft} onReset={reset} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {SHOP.name}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Invoice Generator
        </p>
      </header>

      {phase === "intake" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Include customer name, vehicle, what job/parts were done, and part
            costs (optional).
          </p>

          <VoiceInput
            onSubmit={handleIntake}
            placeholder="e.g. John Smith, 2006 Toyota Corolla, replaced front brake pads + rotors, parts were about $240"
            submitLabel="Generate invoice"
          />
        </div>
      )}

      {phase === "loading" && (
        <div className="flex items-center justify-center gap-3 py-10 text-zinc-500">
          <span className="h-3 w-3 animate-ping rounded-full bg-zinc-400" />
          Thinking…
        </div>
      )}

      {phase === "question" && question && (
        <QuestionCard
          question={question.question}
          options={question.options}
          onAnswer={handleAnswer}
        />
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-red-700 dark:text-red-300">{errorMsg}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
          >
            Start over
          </button>
        </div>
      )}
    </main>
  );
}
