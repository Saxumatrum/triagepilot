"use client";

import { useEffect, useState } from "react";
import type { TriagedTicket } from "@/lib/types";
import { CategoryBadge, PriorityBadge } from "./Badges";
import { TraceView } from "./TraceView";
import { TicketList } from "./TicketList";

const SAMPLE_TICKET =
  "Hi, I was charged twice for my subscription this month and I need this fixed ASAP - it's overdrawing my account. Please help!";

export function TriageApp() {
  const [ticketText, setTicketText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TriagedTicket[]>([]);
  const [selected, setSelected] = useState<TriagedTicket | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/triage")
      .then((res) => res.json())
      .then((data: { tickets: TriagedTicket[] }) => {
        if (cancelled) return;
        setTickets(data.tickets ?? []);
      })
      .catch(() => {
        // Non-fatal: the recent tickets sidebar just stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketText.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketText }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "The triage agent failed.");
      }

      const ticket: TriagedTicket = data.ticket;
      setTickets(data.tickets ?? []);
      setSelected(ticket);
      setReplyDraft(ticket.reply);
      setTicketText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function selectTicket(ticket: TriagedTicket) {
    setSelected(ticket);
    setReplyDraft(ticket.reply);
    setError(null);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">TriagePilot</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Paste a support ticket. The agent classifies it, searches the
            internal knowledge base, and drafts a reply - using real tool
            calls you can inspect below.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <label htmlFor="ticket" className="text-sm font-medium">
            Support ticket
          </label>
          <textarea
            id="ticket"
            value={ticketText}
            onChange={(e) => setTicketText(e.target.value)}
            placeholder="Paste or type the customer's message here..."
            rows={5}
            className="w-full rounded-lg border border-black/15 bg-transparent p-3 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !ticketText.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {loading ? "Triaging..." : "Triage ticket"}
            </button>
            <button
              type="button"
              onClick={() => setTicketText(SAMPLE_TICKET)}
              className="text-sm text-black/50 underline underline-offset-2 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
            >
              Use sample ticket
            </button>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
        </form>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black dark:border-white/30 dark:border-t-white" />
            Running the agent: classifying, searching the knowledge base, and
            drafting a reply...
          </div>
        )}

        {selected && !loading && (
          <div className="space-y-4">
            <section className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                Agent trace
              </h2>
              <TraceView trace={selected.trace} />
            </section>

            <section className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                  Result
                </h2>
                <CategoryBadge category={selected.category} />
                <PriorityBadge priority={selected.priority} />
              </div>
              <p className="text-xs text-black/50 dark:text-white/50">
                {selected.rationale}
              </p>
              <label
                htmlFor="reply"
                className="block text-sm font-medium"
              >
                Drafted reply (editable before sending)
              </label>
              <textarea
                id="reply"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-black/15 bg-transparent p-3 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
              />
            </section>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Recent tickets (this session)
        </h2>
        <TicketList
          tickets={tickets}
          selectedId={selected?.id}
          onSelect={selectTicket}
        />
      </aside>
    </div>
  );
}
