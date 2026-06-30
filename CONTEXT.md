# Garage Invoice

A concept demo: a Vancouver mechanic dictates the vehicle and the work done, an AI
assistant turns it into a structured invoice (asking a clarifying question only when
needed), and the mechanic edits it on a single document that prints as-is.

## Language

**Shop**:
The garage the invoice is issued from. Fixed demo identity (Kartek Auto Services) — not user-configurable.
_Avoid_: Garage, vendor, company

**Intake**:
The mechanic's initial spoken (or typed) description of the vehicle and work done.
_Avoid_: Prompt, input, dictation

**Clarification**:
A single AI follow-up question asked when the intake is ambiguous (e.g. front/rear/both). Answered by tap, voice, or text. Capped at two per session.
_Avoid_: Follow-up, prompt

**Draft**:
The AI-populated invoice before the mechanic edits it. Becomes the printable document.
_Avoid_: Estimate, quote

**Job**:
One billable unit of work — a labor charge plus its associated parts. Distinct jobs are separate line items.
_Avoid_: Line item, task, service

**Part**:
A physical component billed under a job, with quantity and per-unit price.
_Avoid_: Material, product

**Invoice document**:
The single on-screen layout that doubles as the print layout. What you see is what prints.
_Avoid_: Preview, PDF, page

**Estimated price**:
An AI-guessed part price or labor-hour value standing in for a future parts/flat-rate database. Always editable.
_Avoid_: Quote, default

**Shop rate**:
The fixed hourly labor charge applied by the app ($120/hr in the demo).
_Avoid_: Labor cost, billing rate

## Taxes

**GST**:
5% applied to the whole subtotal (labor + parts).

**PST**:
7% applied to parts only — labor is PST-exempt in this demo's simplified BC rules.
