# TriagePilot

TriagePilot is a small AI **agent** that triages incoming support tickets. A
user pastes a free-text support ticket, and the agent uses real tool calling
to work through it step by step:

1. **`classifyTicket`** - a tool that runs a deterministic, rule-based
   classifier over the ticket text and returns a category
   (`billing` / `bug` / `feature-request` / `account` / `other`) and a
   priority (`low` / `medium` / `high` / `urgent`).
2. **`searchKnowledgeBase`** - a tool that searches a small hardcoded FAQ
   array using keyword/substring scoring and returns the top matching
   entries.
3. A final free-text step where the model drafts a reply to the customer,
   using the classification and knowledge base results as context.

The UI shows the agent's full reasoning trail - which tools it called, with
what arguments, and what each one returned - as a numbered step-by-step
trace, alongside the final category/priority badges and an editable reply
draft.

## Why this is architected as a tool-calling agent

The point of this project is to demonstrate an **agentic tool-use
architecture**, not a single prompt-in/text-out call. Concretely:

- `classifyTicket` and `searchKnowledgeBase` are real TypeScript functions
  with their own logic (keyword rules, FAQ scoring) - not stubs the model
  hallucinates around. The model only decides *when* to call them and *what*
  arguments to pass.
- The agent runs a genuine multi-step loop via the Vercel AI SDK's
  `generateText` with `tools` + `stopWhen`. A `prepareStep` callback pins the
  first two steps to `classifyTicket` and `searchKnowledgeBase` respectively
  (so the trace is always deterministic and inspectable end-to-end) and then
  disables tool calling for the final step, where the model must respond
  with plain text.
- Every tool call and tool result is captured via the `onStepEnd` callback
  and surfaced in the UI, so the "reasoning trail" is not a paraphrase - it's
  the actual arguments and return values from the run.

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Vercel AI SDK** (`ai` package) - `generateText`, `tool()` with Zod
  schemas, multi-step tool calling via `stopWhen` / `prepareStep`
- **Vercel AI Gateway** model string (e.g. `"anthropic/claude-sonnet-5"`) so
  it works with `AI_GATEWAY_API_KEY` or a direct `ANTHROPIC_API_KEY`
- **Tailwind CSS v4** for UI
- No external database - tickets and their triage results are kept in a
  module-level in-memory array for the lifetime of the server process. **This
  resets whenever the dev/prod server restarts.**

## Project structure

```
src/lib/faq.ts        Hardcoded FAQ knowledge base + keyword search
src/lib/classify.ts   Deterministic rule-based ticket classifier
src/lib/tools.ts      AI SDK tool() wrappers around the above
src/lib/agent.ts      The multi-step tool-calling agent loop
src/lib/store.ts      In-memory session ticket store
src/app/api/triage    POST to triage a ticket, GET to list recent tickets
src/components/       TriageApp UI, trace view, badges, ticket list
```

## Setup

```bash
npm install
cp .env.example .env.local
# Add your AI_GATEWAY_API_KEY (or ANTHROPIC_API_KEY) to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a support ticket
(or click "Use sample ticket"), and submit.

Without an API key configured, the request/response plumbing, forms, and UI
all still work - the `/api/triage` POST route will return a 500 with the
underlying provider error, which is surfaced in the UI.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build (type-checked)
- `npm run lint` - ESLint
- `npm run start` - run the production build
