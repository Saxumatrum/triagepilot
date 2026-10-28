"use client";

import { useState } from "react";
import { withBase } from "@/lib/basePath";
import { MAX_TICKET_LENGTH, type TriagedTicket } from "@/lib/types";
import { CategoryBadge, PriorityBadge } from "./Badges";
import { TraceView } from "./TraceView";
import { TicketList } from "./TicketList";

// One per category, so visitors can see the agent handle different cases
// in a click.
const SAMPLE_TICKETS = [
  {
    label: "Double charge",
    text: "Hi, I was charged twice for my subscription this month and I need this fixed ASAP - it's overdrawing my account. Please help!",
  },
  {
    label: "API down",
    text: "Our production integration started failing about 20 minutes ago. Every request to your API returns a 503 and our checkout is down for all customers. Is there an outage?",
  },
  {
    label: "Locked out",
    text: "I got a new phone and now I can't log in because the two-factor code goes to my old authenticator app. How do I get back into my account?",
  },
  {
    label: "Feature idea",
    text: "Love the product! It would be great if we could schedule reports to be emailed to the team every Monday morning. Any plans for that?",
  },
];

const MAX_RECENT = 50;

export function TriageApp() {
  const [ticketText, setTicketText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kept in the browser only; the server stores nothing.
  const [tickets, setTickets] = useState<TriagedTicket[]>([]);
  const [selected, setSelected] = useState<TriagedTicket | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    triage(ticketText);
  }

  async function triage(text: string) {
    if (!text.trim() || loading) return;

    setTicketText(text);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(withBase("/api/triage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketText: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "The triage agent failed.");
      }

      const ticket: TriagedTicket = data.ticket;
      setTickets((prev) => [ticket, ...prev].slice(0, MAX_RECENT));
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
            maxLength={MAX_TICKET_LENGTH}
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
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-black/50 dark:text-white/50">
            Or try a sample:
            {SAMPLE_TICKETS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => triage(sample.text)}
                disabled={loading}
                className="rounded-full border border-black/15 px-3 py-1 text-xs text-black/70 hover:border-black/40 disabled:opacity-40 dark:border-white/15 dark:text-white/70 dark:hover:border-white/40"
              >
                {sample.label}
              </button>
            ))}
          </p>
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
