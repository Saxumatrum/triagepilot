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
  "blocked",
  "broken",
  "not working",
  "data loss",
  "lost my data",
  "overcharged",
  "charged twice",
];

// An outage is urgent when it's wide: something is down (first list) AND it
// hits many users or a revenue path (second list). Either alone is "high".
const SERVICE_DOWN_KEYWORDS = [
  "down",
  "outage",
  "502",
  "503",
  "504",
  "500 error",
  "failing",
  "fails",
  "not working",
  "unavailable",
  "unreachable",
  "timing out",
  "times out",
];

const WIDE_IMPACT_KEYWORDS = [
  "all customers",
  "all our customers",
  "all users",
  "all our users",
  "every customer",
  "every user",
  "everyone",
  "every request",
  "all requests",
  "nobody can",
  "no one can",
  "customers can't",
  "customers cannot",
  "production",
  "checkout",
  "payments",
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word/phrase match, so "down" doesn't fire on "download" or
 * "dropdown", and "fails" doesn't fire on "failsafe".
 */
function hasKeyword(text: string, keyword: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}($|[^a-z0-9])`).test(text);
}

function findMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => hasKeyword(text, keyword));
}

function quoteList(keywords: string[]): string {
  return keywords
    .slice(0, 3)
    .map((keyword) => `"${keyword}"`)
    .join(", ");
}

function derivePriority(
  text: string,
  category: Category,
): { priority: Priority; reason: string } {
  const urgentHits = findMatches(text, URGENT_KEYWORDS);
  if (urgentHits.length > 0) {
    return { priority: "urgent", reason: `urgency signal ${quoteList(urgentHits)}` };
  }

  const downHits = findMatches(text, SERVICE_DOWN_KEYWORDS);
  const wideHits = findMatches(text, WIDE_IMPACT_KEYWORDS);
  if (downHits.length > 0 && wideHits.length > 0) {
    return {
      priority: "urgent",
      reason: `outage (${quoteList(downHits)}) with wide impact (${quoteList(wideHits)})`,
    };
  }

  const highHits = findMatches(text, HIGH_KEYWORDS);
  if (highHits.length > 0) {
    return { priority: "high", reason: `impact signal ${quoteList(highHits)}` };
  }

  const lowHits = findMatches(text, LOW_KEYWORDS);
  if (lowHits.length > 0) {
    return { priority: "low", reason: `low-urgency signal ${quoteList(lowHits)}` };
  }

  // Billing and bug tickets default slightly higher than feature requests,
  // since money and broken functionality tend to be more time-sensitive.
  if (category === "billing" || category === "bug") {
    return { priority: "medium", reason: `default for ${category} tickets` };
  }
  if (category === "feature-request") {
    return { priority: "low", reason: "default for feature requests" };
  }
  return { priority: "medium", reason: "no urgency signals" };
}

/**
 * Deterministic, keyword-driven ticket classifier. This is the real logic
 * behind the `classifyTicket` tool - it does not call the LLM. Keeping it
 * rule-based makes the agent's tool step fast, reproducible, and easy to
 * unit test independently of any model.
 */
export function classifyTicket(ticketText: string): ClassificationResult {
  // Curly apostrophes (common when pasting from email) would otherwise miss
  // keywords like "can't log in".
  const text = ticketText.toLowerCase().replace(/[‘’]/g, "'");

  let bestCategory: Category = "other";
  let bestScore = 0;
  const matchedKeywordsByCategory = new Map<Category, string[]>();

  for (const rule of CATEGORY_RULES) {
    const matched = findMatches(text, rule.keywords);
    if (matched.length > 0) {
      matchedKeywordsByCategory.set(rule.category, matched);
    }
    if (matched.length > bestScore) {
      bestScore = matched.length;
      bestCategory = rule.category;
    }
  }

  const { priority, reason } = derivePriority(text, bestCategory);

  const matchedKeywords = matchedKeywordsByCategory.get(bestCategory) ?? [];
  const rationale =
    bestScore > 0
      ? `Matched category "${bestCategory}" on keyword(s): ${matchedKeywords
          .slice(0, 4)
          .join(", ")}. Priority "${priority}": ${reason}.`
      : `No strong category keywords matched; defaulted to "other". Priority "${priority}": ${reason}.`;

  return {
    category: bestCategory,
    priority,
    rationale,
  };
}
