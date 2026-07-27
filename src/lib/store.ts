import type { TriagedTicket } from "./types";

/**
 * In-memory, module-level ticket store for this server process.
 *
 * There is no external database by design for this portfolio project -
 * all triaged tickets live only for the lifetime of the running process
 * and are lost on restart or redeploy. Newest tickets are kept first.
 */
const tickets: TriagedTicket[] = [];

const MAX_STORED_TICKETS = 50;

export function addTicket(ticket: TriagedTicket): void {
  tickets.unshift(ticket);
  tickets.length = Math.min(tickets.length, MAX_STORED_TICKETS);
}

export function getTickets(): TriagedTicket[] {
  return tickets;
}
