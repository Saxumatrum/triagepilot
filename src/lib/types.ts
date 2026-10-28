/** Maximum accepted length for submitted ticket text, enforced client- and server-side. */
export const MAX_TICKET_LENGTH = 4000;

export const CATEGORIES = [
  "billing",
  "bug",
  "feature-request",
  "account",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

/** A single FAQ entry in the internal knowledge base. */
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

/** A single match returned by the knowledge base search. */
export interface FaqMatch {
  id: string;
  question: string;
  answer: string;
  score: number;
}

/** One step in the agent's tool-calling trace, shown in the UI. */
export interface TraceStep {
  step: number;
  type: "tool-call" | "tool-result" | "text";
  toolName?: string;
  args?: unknown;
  result?: unknown;
  text?: string;
}

/** Result of classifying a ticket, produced by the classifyTicket tool. */
export interface ClassificationResult {
  category: Category;
  priority: Priority;
  rationale: string;
}

/** A fully triaged ticket, kept in the visitor's browser for the session. */
export interface TriagedTicket {
  id: string;
  ticketText: string;
  category: Category;
  priority: Priority;
  rationale: string;
  kbMatches: FaqMatch[];
  reply: string;
  trace: TraceStep[];
  createdAt: string;
}
