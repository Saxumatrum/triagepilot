import { tool } from "ai";
import { z } from "zod";
import { classifyTicket } from "./classify";
import { searchFaq } from "./faq";

/**
 * Tool 1: classifyTicket
 *
 * Real, deterministic logic (see classify.ts) - the model calls this tool
 * with the raw ticket text, and the tool returns a category + priority
 * derived from rule-based keyword analysis. This is a genuine tool call
 * rather than a structured-output shortcut, so the classification step
 * shows up as an inspectable step in the agent's trace.
 */
export const classifyTicketTool = tool({
  description:
    "Classify a support ticket into a category and priority using the internal triage rules. Always call this first, passing the full ticket text exactly as submitted.",
  inputSchema: z.object({
    ticketText: z
      .string()
      .describe("The full, verbatim text of the customer's support ticket."),
  }),
  execute: async ({ ticketText }) => {
    const result = classifyTicket(ticketText);
    return result;
  },
});

/**
 * Tool 2: searchKnowledgeBase
 *
 * Searches a small hardcoded internal FAQ array using keyword/substring
 * scoring (see faq.ts). No embeddings - deterministic and fast, which
 * keeps the demo reproducible.
 */
export const searchKnowledgeBaseTool = tool({
  description:
    "Search the internal FAQ knowledge base for entries relevant to the customer's issue. Call this with a short search query capturing the core of the customer's problem (e.g. 'reset password', 'refund policy').",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "A short search query describing the customer's issue, e.g. 'cancel subscription' or 'double charge'.",
      ),
  }),
  execute: async ({ query }) => {
    const matches = searchFaq(query);
    return { query, matches };
  },
});

export const triageTools = {
  classifyTicket: classifyTicketTool,
  searchKnowledgeBase: searchKnowledgeBaseTool,
};
