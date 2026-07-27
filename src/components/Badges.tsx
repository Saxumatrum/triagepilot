import type { Category, Priority } from "@/lib/types";

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-500/30",
  high: "bg-orange-100 text-orange-800 ring-orange-600/20 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-500/30",
  medium: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-500/30",
  low: "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-500/30",
};

const CATEGORY_STYLES: Record<Category, string> = {
  billing: "bg-purple-100 text-purple-800 ring-purple-600/20 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-500/30",
  bug: "bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-500/30",
  "feature-request": "bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-500/30",
  account: "bg-indigo-100 text-indigo-800 ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-500/30",
  other: "bg-slate-100 text-slate-800 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/30",
};

function BaseBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <BaseBadge label={priority} className={PRIORITY_STYLES[priority]} />;
}

export function CategoryBadge({ category }: { category: Category }) {
  return <BaseBadge label={category} className={CATEGORY_STYLES[category]} />;
}
