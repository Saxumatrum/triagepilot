import type { Category, ClassificationResult, Priority } from "./types";

interface CategoryRule {
  category: Category;
  keywords: string[];
}

// Ordered by specificity: the first matching rule with the highest score wins.
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "billing",
    keywords: [
      "charge",
      "charged",
      "refund",
      "invoice",
      "payment",
      "subscription",
      "billing",
      "credit card",
      "price",
      "overcharged",
      "receipt",
      "cancel my plan",
      "renew",
    ],
  },
  {
    category: "bug",
    keywords: [
      "error",
      "bug",
      "crash",
      "broken",
      "not working",
      "doesn't work",
      "500",
      "404",
      "exception",
      "freeze",
      "frozen",
      "glitch",
      "stuck",
      "fails",
      "failing",
    ],
  },
  {
    category: "feature-request",
    keywords: [
      "feature request",
      "would be nice",
      "please add",
      "suggestion",
      "could you add",
      "wish list",
      "roadmap",
      "it would be great if",
      "please support",
    ],
  },
  {
    category: "account",
    keywords: [
      "password",
      "login",
      "log in",
      "locked out",
      "2fa",
      "two-factor",
      "delete my account",
      "account access",
      "email address",
      "username",
      "sign in",
      "permissions",
      "invite",
    ],
  },
];

const URGENT_KEYWORDS = [
  "urgent",
  "asap",
  "immediately",
  "emergency",
  "production is down",
  "site is down",
  "can't access anything",
  "losing money",
  "critical",
  "right now",
];

const HIGH_KEYWORDS = [
  "down",
  "outage",
  "can't log in",
  "can't access",
  "all users",
  "everyone",
  "blocked",
  "broken",
  "not working",
  "data loss",
  "lost my data",
  "overcharged",
  "charged twice",
];

const LOW_KEYWORDS = [
  "just curious",
  "no rush",
  "whenever you get a chance",
  "small suggestion",
  "minor",
  "would be nice",
  "feature request",
  "someday",
];

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count++;
  }
  return count;
}

function derivePriority(text: string, category: Category): Priority {
  const urgentHits = countMatches(text, URGENT_KEYWORDS);
  if (urgentHits > 0) return "urgent";

  const highHits = countMatches(text, HIGH_KEYWORDS);
  if (highHits > 0) return "high";

  const lowHits = countMatches(text, LOW_KEYWORDS);
  if (lowHits > 0) return "low";

  // Billing and bug tickets default slightly higher than feature requests,
  // since money and broken functionality tend to be more time-sensitive.
  if (category === "billing" || category === "bug") return "medium";
  if (category === "feature-request") return "low";
  return "medium";
}

/**
 * Deterministic, keyword-driven ticket classifier. This is the real logic
 * behind the `classifyTicket` tool - it does not call the LLM. Keeping it
 * rule-based makes the agent's tool step fast, reproducible, and easy to
 * unit test independently of any model.
 */
export function classifyTicket(ticketText: string): ClassificationResult {
  const text = ticketText.toLowerCase();

  let bestCategory: Category = "other";
  let bestScore = 0;
  const matchedKeywordsByCategory = new Map<Category, string[]>();

  for (const rule of CATEGORY_RULES) {
    const matched = rule.keywords.filter((keyword) => text.includes(keyword));
    if (matched.length > 0) {
      matchedKeywordsByCategory.set(rule.category, matched);
    }
    if (matched.length > bestScore) {
      bestScore = matched.length;
      bestCategory = rule.category;
    }
  }

  const priority = derivePriority(text, bestCategory);

  const matchedKeywords = matchedKeywordsByCategory.get(bestCategory) ?? [];
  const rationale =
    bestScore > 0
      ? `Matched category "${bestCategory}" on keyword(s): ${matchedKeywords
          .slice(0, 4)
          .join(", ")}. Priority "${priority}" based on urgency signals in the ticket text.`
      : `No strong category keywords matched; defaulted to "other". Priority "${priority}" based on urgency signals in the ticket text.`;

  return {
    category: bestCategory,
    priority,
    rationale,
  };
}
