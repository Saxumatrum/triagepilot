import type { TriagedTicket } from "@/lib/types";
import { CategoryBadge, PriorityBadge } from "./Badges";

export function TicketList({
  tickets,
  selectedId,
  onSelect,
}: {
  tickets: TriagedTicket[];
  selectedId: string | undefined;
  onSelect: (ticket: TriagedTicket) => void;
}) {
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        No tickets triaged yet this session.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <button
            type="button"
            onClick={() => onSelect(ticket)}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
              ticket.id === selectedId
                ? "border-black/30 bg-black/[.04] dark:border-white/30 dark:bg-white/[.06]"
                : "border-black/10 hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.03]"
            }`}
          >
            <p className="line-clamp-2 font-medium">{ticket.ticketText}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="mt-1.5 text-xs text-black/40 dark:text-white/40">
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
