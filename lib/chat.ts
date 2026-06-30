import type { InvoiceDraft } from "./invoice";

// Anthropic-format conversation turns, stored on the client and replayed each call.
// Content is either plain text (intake / answers) or tool-protocol blocks.
export type ChatMessage = {
  role: "user" | "assistant";
  content: unknown;
};

export type ChatRequest = {
  messages: ChatMessage[];
  /** How many questions the AI has already asked this session (max 2). */
  questionCount: number;
};

export type AskResult = {
  kind: "question";
  question: string;
  options: string[];
  toolUseId: string;
  /** Raw assistant turn to append to history before the next call. */
  assistantContent: unknown;
};

export type DraftResult = {
  kind: "draft";
  draft: InvoiceDraft;
};

export type ErrorResult = {
  kind: "error";
  message: string;
};

export type ChatResponse = AskResult | DraftResult | ErrorResult;
