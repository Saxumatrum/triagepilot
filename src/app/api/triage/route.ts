import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { runTriageAgent } from "@/lib/agent";
import { rateLimit } from "@/lib/rateLimit";
import { MAX_TICKET_LENGTH, type TriagedTicket } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = rateLimit(request, "triage", 20);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const ticketText =
    typeof body === "object" && body !== null && "ticketText" in body
      ? (body as { ticketText: unknown }).ticketText
      : undefined;

  if (typeof ticketText !== "string" || ticketText.trim().length === 0) {
    return NextResponse.json(
      { error: "ticketText is required and must be a non-empty string." },
      { status: 400 },
    );
  }

  if (ticketText.length > MAX_TICKET_LENGTH) {
    return NextResponse.json(
      { error: `ticketText must be ${MAX_TICKET_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  try {
    const agentResult = await runTriageAgent(ticketText.trim());

    const ticket: TriagedTicket = {
      id: randomUUID(),
      ticketText: ticketText.trim(),
      category: agentResult.classification.category,
      priority: agentResult.classification.priority,
      rationale: agentResult.classification.rationale,
      kbMatches: agentResult.kbMatches,
      reply: agentResult.reply,
      trace: agentResult.trace,
      createdAt: new Date().toISOString(),
    };

    // Nothing is stored server-side: the "recent tickets" list lives in the
    // visitor's browser, so visitors never see each other's tickets.
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Triage agent failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error running the triage agent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
