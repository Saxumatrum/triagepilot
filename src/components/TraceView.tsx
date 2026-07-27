import type { TraceStep } from "@/lib/types";

function describeStep(step: TraceStep): { title: string; body: string } {
  if (step.type === "tool-call") {
    return {
      title: `Called ${step.toolName}(...)`,
      body: JSON.stringify(step.args, null, 2),
    };
  }
  if (step.type === "tool-result") {
    return {
      title: `${step.toolName} returned`,
      body: JSON.stringify(step.result, null, 2),
    };
  }
  return {
    title: "Drafted final reply",
    body: step.text ?? "",
  };
}

const TYPE_DOT: Record<TraceStep["type"], string> = {
  "tool-call": "bg-sky-500",
  "tool-result": "bg-emerald-500",
  text: "bg-violet-500",
};

export function TraceView({ trace }: { trace: TraceStep[] }) {
  if (trace.length === 0) return null;

  return (
    <ol className="space-y-3">
      {trace.map((step, index) => {
        const { title, body } = describeStep(step);
        return (
          <li
            key={index}
            className="rounded-lg border border-black/10 bg-black/[.02] p-3 dark:border-white/10 dark:bg-white/[.03]"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[step.type]}`}
                aria-hidden
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                Step {index + 1}
              </span>
              <span className="font-mono text-sm">{title}</span>
            </div>
            {body && (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-black/5 p-2 text-xs dark:bg-white/5">
                {body}
              </pre>
            )}
          </li>
        );
      })}
    </ol>
  );
}
