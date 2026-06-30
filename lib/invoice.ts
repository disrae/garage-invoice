// Domain types and pricing logic for the garage invoice demo.
// See CONTEXT.md for the ubiquitous language behind these names.

export type Part = {
  name: string;
  qty: number;
  /** Per-unit price in CAD. Null means the AI couldn't estimate it. */
  unitPrice: number | null;
};

/** One billable unit of work: labor plus its associated parts. */
export type Job = {
  description: string;
  laborHours: number;
  parts: Part[];
};

export type Vehicle = {
  year: number | null;
  make: string;
  model: string;
};

export type Customer = {
  name: string;
};

/** The AI-populated invoice the mechanic edits before printing. */
export type InvoiceDraft = {
  vehicle: Vehicle;
  customer: Customer;
  jobs: Job[];
  notes: string;
};

// --- Fixed demo shop identity (not user-configurable) ---
export const SHOP = {
  name: "Kartek Auto Services",
  owner: "Stewart Cheng",
  address: "3812 Main Street, Vancouver, BC V5V 3N9",
  phone: "(604) 873-1715",
} as const;

/** Static hourly labor rate for the demo. Future: flat-rate DB. */
export const LABOR_RATE = 120;

// BC tax rules (demo simplification): GST on everything, PST on parts only.
export const GST_RATE = 0.05;
export const PST_RATE = 0.07;

export type InvoiceTotals = {
  laborSubtotal: number;
  partsSubtotal: number;
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
};

export function computeTotals(jobs: Job[]): InvoiceTotals {
  const laborSubtotal = jobs.reduce(
    (sum, job) => sum + job.laborHours * LABOR_RATE,
    0,
  );
  const partsSubtotal = jobs.reduce(
    (sum, job) =>
      sum +
      job.parts.reduce((p, part) => p + (part.unitPrice ?? 0) * part.qty, 0),
    0,
  );
  const subtotal = laborSubtotal + partsSubtotal;
  const gst = subtotal * GST_RATE;
  const pst = partsSubtotal * PST_RATE; // labor is PST-exempt
  const total = subtotal + gst + pst;
  return { laborSubtotal, partsSubtotal, subtotal, gst, pst, total };
}

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

/** Static metadata for the demo — no persistence. */
export const INVOICE_NUMBER = "INV-001";

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
