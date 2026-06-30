import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import type { ChatRequest, ChatResponse } from "@/lib/chat";
import { LABOR_RATE, SHOP } from "@/lib/invoice";

const MODEL = "claude-sonnet-4-5";
const MAX_QUESTIONS = 2;

const SYSTEM_PROMPT = `You are the invoice assistant for ${SHOP.name}, an auto repair shop in Vancouver, BC (owner: ${SHOP.owner}).

A mechanic dictates the vehicle and the work they did. Your job is to turn that into a structured invoice draft.

Rules:
- The shop labor rate is $${LABOR_RATE}/hr (applied automatically by the app — you only provide labor HOURS, not dollar amounts for labor).
- Best-guess labor hours for each job from your general knowledge of flat-rate times for that vehicle/job.
- Best-guess part prices (CAD) from your general knowledge. If you truly cannot guess, set unitPrice to null.
- Split distinct jobs into separate line items (e.g. brake pads and rotors are two jobs).
- NEVER ask about prices or labor hours — always estimate those yourself.

Asking questions:
- You may ask up to ${MAX_QUESTIONS} questions total before producing the invoice. Use them to make the invoice complete and realistic — don't skip a useful question just to be fast, but never exceed ${MAX_QUESTIONS}.
- Ask only ONE question per turn. Prefer a small set of tap-friendly options when the answer is constrained.
- Choose your questions by this priority, asking about whatever is missing or unclear:
  1. The vehicle, if missing or incomplete (year / make / model).
  2. Ambiguous job scope — e.g. brakes/suspension without front/rear/both, or quantity (one rotor vs a pair).
  3. The customer's name, if the mechanic didn't mention one (a real invoice needs someone to bill).
- If the mechanic already gave the vehicle and clear jobs but no customer name, spend a question asking who the customer is (e.g. "Who's this invoice for?").
- Extract the customer name from speech when it's mentioned (e.g. "did John's Corolla") instead of asking.

Finishing:
- Once you've asked your needed questions (or hit the ${MAX_QUESTIONS}-question limit), call create_invoice_draft. Leave a field blank/null only if you still don't have it after asking.`;

const tools: Anthropic.Tool[] = [
  {
    name: "ask_question",
    description:
      "Ask the mechanic ONE clarifying question before building the invoice. Use only when something is genuinely ambiguous.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to ask." },
        options: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional short tap-to-answer choices, e.g. ['Front', 'Rear', 'Both'].",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "create_invoice_draft",
    description:
      "Create the editable invoice draft once you have enough information to bill.",
    input_schema: {
      type: "object",
      properties: {
        vehicle: {
          type: "object",
          properties: {
            year: { type: ["number", "null"] },
            make: { type: "string" },
            model: { type: "string" },
          },
          required: ["year", "make", "model"],
        },
        customer: {
          type: "object",
          properties: {
            name: { type: "string", description: "Empty string if unknown." },
          },
          required: ["name"],
        },
        jobs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              laborHours: { type: "number" },
              parts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    qty: { type: "number" },
                    unitPrice: {
                      type: ["number", "null"],
                      description: "Per-unit CAD price, or null if unknown.",
                    },
                  },
                  required: ["name", "qty", "unitPrice"],
                },
              },
            },
            required: ["description", "laborHours", "parts"],
          },
        },
        notes: { type: "string", description: "Empty string if none." },
      },
      required: ["vehicle", "customer", "jobs", "notes"],
    },
  },
];

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({
      kind: "error",
      message: "ANTHROPIC_API_KEY is not set. Add it to .env and restart.",
    });
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return json({ kind: "error", message: "Invalid request body." });
  }

  const client = new Anthropic({ apiKey });

  // Enforce the question cap: once used up, force the draft tool.
  const forceDraft = body.questionCount >= MAX_QUESTIONS;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools,
      tool_choice: forceDraft
        ? { type: "tool", name: "create_invoice_draft" }
        : { type: "any" },
      messages: body.messages as Anthropic.MessageParam[],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (!toolUse) {
      return json({
        kind: "error",
        message: "The assistant did not return a structured result.",
      });
    }

    if (toolUse.name === "ask_question") {
      const input = toolUse.input as { question: string; options?: string[] };
      return json({
        kind: "question",
        question: input.question,
        options: input.options ?? [],
        toolUseId: toolUse.id,
        assistantContent: response.content,
      });
    }

    return json({ kind: "draft", draft: toolUse.input as never });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling Claude.";
    return json({ kind: "error", message });
  }
}

function json(payload: ChatResponse): Response {
  return Response.json(payload);
}
