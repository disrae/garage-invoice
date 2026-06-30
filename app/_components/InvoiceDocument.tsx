"use client";

import {
  computeTotals,
  formatCAD,
  INVOICE_NUMBER,
  LABOR_RATE,
  SHOP,
  todayISO,
  type InvoiceDraft,
  type Job,
  type Part,
} from "@/lib/invoice";

type Props = {
  draft: InvoiceDraft;
  onChange: (draft: InvoiceDraft) => void;
  onReset: () => void;
};

export function InvoiceDocument({ draft, onChange, onReset }: Props) {
  const totals = computeTotals(draft.jobs);

  const updateJob = (index: number, patch: Partial<Job>) => {
    const jobs = draft.jobs.map((job, i) =>
      i === index ? { ...job, ...patch } : job,
    );
    onChange({ ...draft, jobs });
  };

  const updatePart = (jobIndex: number, partIndex: number, patch: Partial<Part>) => {
    const jobs = draft.jobs.map((job, i) => {
      if (i !== jobIndex) return job;
      const parts = job.parts.map((part, p) =>
        p === partIndex ? { ...part, ...patch } : part,
      );
      return { ...job, parts };
    });
    onChange({ ...draft, jobs });
  };

  const addJob = () => {
    onChange({
      ...draft,
      jobs: [...draft.jobs, { description: "New job", laborHours: 0, parts: [] }],
    });
  };

  const removeJob = (index: number) => {
    onChange({ ...draft, jobs: draft.jobs.filter((_, i) => i !== index) });
  };

  const addPart = (jobIndex: number) => {
    const jobs = draft.jobs.map((job, i) =>
      i === jobIndex
        ? { ...job, parts: [...job.parts, { name: "New part", qty: 1, unitPrice: 0 }] }
        : job,
    );
    onChange({ ...draft, jobs });
  };

  const removePart = (jobIndex: number, partIndex: number) => {
    const jobs = draft.jobs.map((job, i) =>
      i === jobIndex
        ? { ...job, parts: job.parts.filter((_, p) => p !== partIndex) }
        : job,
    );
    onChange({ ...draft, jobs });
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Toolbar — never printed */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Edit any field below, then print. Tip: in the print dialog choose
          “Save as PDF”.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            New invoice
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* The document — this is what prints */}
      <div className="invoice-paper rounded-lg border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-zinc-800">
        <header className="flex items-start justify-between border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{SHOP.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">{SHOP.owner}</p>
            <p className="text-sm text-zinc-600">{SHOP.address}</p>
            <p className="text-sm text-zinc-600">{SHOP.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold uppercase tracking-widest text-zinc-500">
              Invoice
            </p>
            <p className="mt-1 text-sm text-zinc-600">{INVOICE_NUMBER}</p>
            <p className="text-sm text-zinc-600">{todayISO()}</p>
          </div>
        </header>

        {/* Bill-to / vehicle */}
        <section className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Customer
            </p>
            <input
              className="inv-input w-full text-sm"
              value={draft.customer.name}
              placeholder="Customer name"
              onChange={(e) =>
                onChange({ ...draft, customer: { name: e.target.value } })
              }
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Vehicle
            </p>
            <div className="flex items-center gap-1 text-sm">
              <input
                className="inv-input w-14"
                value={draft.vehicle.year ?? ""}
                placeholder="Year"
                inputMode="numeric"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    vehicle: {
                      ...draft.vehicle,
                      year: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
              />
              <input
                className="inv-input w-20"
                value={draft.vehicle.make}
                placeholder="Make"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    vehicle: { ...draft.vehicle, make: e.target.value },
                  })
                }
              />
              <input
                className="inv-input flex-1"
                value={draft.vehicle.model}
                placeholder="Model"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    vehicle: { ...draft.vehicle, model: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* Line items — job-centric */}
        <section>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-zinc-300 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span>Description</span>
            <span className="text-right">Qty / Hrs</span>
            <span className="text-right">Amount</span>
          </div>

          {draft.jobs.map((job, jobIndex) => {
            const laborAmount = job.laborHours * LABOR_RATE;
            return (
              <div
                key={jobIndex}
                className="invoice-job border-b border-zinc-100 py-3"
              >
                {/* Labor row */}
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeJob(jobIndex)}
                      aria-label="Remove job"
                      className="no-print text-zinc-300 hover:text-red-600"
                    >
                      ×
                    </button>
                    <input
                      className="inv-input w-full font-medium"
                      value={job.description}
                      onChange={(e) =>
                        updateJob(jobIndex, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm text-zinc-600">
                    <input
                      className="inv-input w-12 text-right"
                      value={job.laborHours}
                      inputMode="decimal"
                      onChange={(e) =>
                        updateJob(jobIndex, {
                          laborHours: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="text-xs">hr</span>
                  </div>
                  <span className="w-24 text-right text-sm tabular-nums">
                    {formatCAD(laborAmount)}
                  </span>
                </div>
                <p className="pl-6 text-xs text-zinc-400">
                  Labor @ {formatCAD(LABOR_RATE)}/hr
                </p>

                {/* Parts sub-rows */}
                {job.parts.map((part, partIndex) => (
                  <div
                    key={partIndex}
                    className="mt-1 grid grid-cols-[1fr_auto_auto] items-center gap-2 pl-6"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removePart(jobIndex, partIndex)}
                        aria-label="Remove part"
                        className="no-print text-zinc-300 hover:text-red-600"
                      >
                        ×
                      </button>
                      <span className="text-zinc-400">↳</span>
                      <input
                        className="inv-input w-full text-sm"
                        value={part.name}
                        onChange={(e) =>
                          updatePart(jobIndex, partIndex, { name: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1 text-sm text-zinc-600">
                      <span className="text-xs">×</span>
                      <input
                        className="inv-input w-10 text-right"
                        value={part.qty}
                        inputMode="numeric"
                        onChange={(e) =>
                          updatePart(jobIndex, partIndex, {
                            qty: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="text-xs">@</span>
                      <input
                        className="inv-input w-16 text-right"
                        value={part.unitPrice ?? ""}
                        placeholder="—"
                        inputMode="decimal"
                        onChange={(e) =>
                          updatePart(jobIndex, partIndex, {
                            unitPrice: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>
                    <span className="w-24 text-right text-sm tabular-nums">
                      {formatCAD((part.unitPrice ?? 0) * part.qty)}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addPart(jobIndex)}
                  className="no-print ml-6 mt-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  + Add part
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addJob}
            className="no-print mt-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            + Add job
          </button>
        </section>

        {/* Totals */}
        <section className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <Row label="Labor" value={formatCAD(totals.laborSubtotal)} />
            <Row label="Parts" value={formatCAD(totals.partsSubtotal)} />
            <Row label="Subtotal" value={formatCAD(totals.subtotal)} />
            <Row label="GST (5%)" value={formatCAD(totals.gst)} />
            <Row label="PST (7% parts)" value={formatCAD(totals.pst)} />
            <div className="mt-1 flex justify-between border-t border-zinc-300 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCAD(totals.total)}</span>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Notes
          </p>
          <textarea
            className="inv-input min-h-[2.5rem] w-full resize-none text-sm"
            value={draft.notes}
            placeholder="—"
            rows={2}
            onChange={(e) => onChange({ ...draft, notes: e.target.value })}
          />
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-400">
          Thank you for your business — {SHOP.name}
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-600">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
