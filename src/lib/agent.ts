import { generateText, isStepCount } from "ai";
import type { ClassificationResult, FaqMatch, TraceStep } from "./types";
import { triageTools } from "./tools";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

export interface AgentRunResult {
  classification: ClassificationResult;
  kbMatches: FaqMatch[];
  reply: string;
  trace: TraceStep[];
}

const SYSTEM_PROMPT = [
  "You are TriagePilot, an internal support-ticket triage agent.",
  "For every ticket you MUST, in this exact order:",
  "1. Call the classifyTicket tool with the ticket's full text.",
  "2. Call the searchKnowledgeBase tool with a short query capturing the customer's core issue.",
  "3. Write a helpful, concise reply directly to the customer. Use relevant knowledge base information when it applies, and set expectations appropriate to the ticket's priority.",
  "Do not mention internal tool names, categories, priorities, or the word 'ticket' in the reply - write as if you are a support agent replying directly to the customer.",
].join("\n");

/**
 * Runs the triage agent over a single support ticket.
 *
 * This is a real multi-step tool-calling loop (not a single prompt-in/
 * text-out call): `prepareStep` pins the first two steps to the
 * classifyTicket and searchKnowledgeBase tools respectively, so the trace
 * is always deterministic and inspectable, then lets the model write a
 * final free-text reply with tool calling disabled. `stopWhen` provides a
 * hard safety cap in case the model behaves unexpectedly.
 */
export async function runTriageAgent(
  ticketText: string,
): Promise<AgentRunResult> {
  const model = process.env.TRIAGE_MODEL ?? DEFAULT_MODEL;

  const trace: TraceStep[] = [];
  let stepCounter = 0;
  let classification: ClassificationResult | undefined;
  let kbMatches: FaqMatch[] = [];

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Here is the support ticket:\n"""\n${ticketText}\n"""`,
    tools: triageTools,
    stopWhen: isStepCount(4),
    prepareStep: ({ stepNumber }) => {
      if (stepNumber === 0) {
        return {
          activeTools: ["classifyTicket"],
          toolChoice: { type: "tool" as const, toolName: "classifyTicket" as const },
        };
      }
      if (stepNumber === 1) {
        return {
          activeTools: ["searchKnowledgeBase"],
          toolChoice: {
            type: "tool" as const,
            toolName: "searchKnowledgeBase" as const,
          },
        };
      }
      return { toolChoice: "none" as const };
    },
    onStepEnd: ({ toolCalls, toolResults, text }) => {
      for (const call of toolCalls) {
        trace.push({
          step: stepCounter++,
          type: "tool-call",
          toolName: call.toolName,
          args: call.input,
        });
      }
      for (const res of toolResults) {
        if (res.toolName === "classifyTicket") {
          classification = res.output as ClassificationResult;
        }
        if (res.toolName === "searchKnowledgeBase") {
          const output = res.output as { query: string; matches: FaqMatch[] };
          kbMatches = output.matches;
        }
        trace.push({
          step: stepCounter++,
          type: "tool-result",
          toolName: res.toolName,
          result: res.output,
        });
      }
      if (text) {
        trace.push({
          step: stepCounter++,
          type: "text",
          text,
        });
      }
    },
  });

  if (!classification) {
    // Defensive fallback: should not happen given the forced tool choice on
    // step 0, but keeps the return type sound if a provider ever misbehaves.
    throw new Error(
      "Agent did not produce a classification result. Check TRIAGE_MODEL / AI_GATEWAY_API_KEY configuration.",
    );
  }

  return {
    classification,
    kbMatches,
    reply: result.text.trim(),
    trace,
  };
}
