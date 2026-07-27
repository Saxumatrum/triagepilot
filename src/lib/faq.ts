import type { FaqEntry, FaqMatch } from "./types";

/**
 * Hardcoded internal knowledge base. In a real product this would be a
 * database or vector store; here it's a small, realistic FAQ set that the
 * `searchKnowledgeBase` tool searches with plain keyword scoring.
 */
export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "reset-password",
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click 'Forgot password'. We'll email a reset link that's valid for 30 minutes. If the email doesn't arrive within a few minutes, check your spam folder or request a new link.",
    keywords: [
      "reset",
      "password",
      "forgot",
      "login",
      "log in",
      "sign in",
      "locked out",
      "can't log in",
    ],
  },
  {
    id: "refund-policy",
    question: "What is your refund policy?",
    answer:
      "We offer full refunds within 14 days of purchase, no questions asked. After 14 days, refunds are prorated for the unused portion of the current billing period. Contact billing@example.com with your order number to start a refund.",
    keywords: [
      "refund",
      "money back",
      "reimburse",
      "return",
      "14 days",
      "cancel order",
    ],
  },
  {
    id: "cancel-subscription",
    question: "How do I cancel my subscription?",
    answer:
      "Open Account Settings > Billing > Manage Subscription and click 'Cancel Plan'. Your plan stays active until the end of the current billing period, and you won't be charged again after that.",
    keywords: [
      "cancel",
      "subscription",
      "unsubscribe",
      "stop billing",
      "stop my plan",
      "end my plan",
    ],
  },
  {
    id: "update-payment-method",
    question: "How do I update my payment method or credit card?",
    answer:
      "Go to Account Settings > Billing > Payment Methods and click 'Add payment method'. You can set a new card as default and remove old ones. Card details are handled by our PCI-compliant payment processor and never touch our servers.",
    keywords: [
      "payment method",
      "credit card",
      "update card",
      "card expired",
      "billing information",
      "charge failed",
    ],
  },
  {
    id: "double-charge",
    question: "I was charged twice / an unexpected charge appeared",
    answer:
      "Duplicate charges are usually a temporary authorization hold that clears within 3-5 business days. If you still see two charges after that, email billing@example.com with the charge dates and amounts and we'll refund the duplicate immediately.",
    keywords: [
      "charged twice",
      "double charge",
      "duplicate charge",
      "unexpected charge",
      "wrong amount",
      "overcharged",
    ],
  },
  {
    id: "export-data",
    question: "Can I export my data?",
    answer:
      "Yes. Go to Account Settings > Data > Export. You can export as CSV or JSON, and exports include all records owned by your account. Large exports are emailed as a download link within a few minutes.",
    keywords: [
      "export",
      "download my data",
      "csv",
      "json",
      "backup",
      "data portability",
    ],
  },
  {
    id: "invite-team-members",
    question: "How do I invite teammates to my workspace?",
    answer:
      "Go to Workspace Settings > Members > Invite and enter their email address. Invited members get an email with a signup link. Your plan's seat limit determines how many active members you can have.",
    keywords: [
      "invite",
      "team member",
      "teammate",
      "add user",
      "workspace member",
      "seats",
    ],
  },
  {
    id: "api-rate-limits",
    question: "What are the API rate limits?",
    answer:
      "The API allows 100 requests per minute on the Free plan and 1,000 requests per minute on paid plans. Rate-limited responses return HTTP 429 with a Retry-After header. Contact us if you need a higher limit for a specific use case.",
    keywords: [
      "api",
      "rate limit",
      "429",
      "too many requests",
      "throttle",
      "requests per minute",
    ],
  },
  {
    id: "outage-status",
    question: "Is there an outage? The app / API is down.",
    answer:
      "Check status.example.com for real-time system status and incident history. If status.example.com shows all systems operational but you still can't connect, it's likely a local network or account-specific issue rather than a broad outage.",
    keywords: [
      "down",
      "outage",
      "not working",
      "can't connect",
      "500 error",
      "unavailable",
      "status page",
    ],
  },
  {
    id: "delete-account",
    question: "How do I permanently delete my account?",
    answer:
      "Go to Account Settings > Danger Zone > Delete Account. This is permanent and removes all your data after a 7-day grace period, during which you can cancel the deletion by logging back in. Active subscriptions must be cancelled first.",
    keywords: [
      "delete account",
      "close account",
      "remove my account",
      "permanently delete",
      "gdpr",
      "erase my data",
    ],
  },
  {
    id: "two-factor-auth",
    question: "How do I enable two-factor authentication (2FA)?",
    answer:
      "Go to Account Settings > Security > Two-Factor Authentication and scan the QR code with an authenticator app like Google Authenticator or Authy. Save the backup codes somewhere safe in case you lose access to your device.",
    keywords: [
      "2fa",
      "two-factor",
      "two factor",
      "mfa",
      "authenticator",
      "security code",
    ],
  },
  {
    id: "feature-request-process",
    question: "How can I request a new feature?",
    answer:
      "Submit feature ideas at feedback.example.com, where the community can upvote and comment on requests. Our product team reviews the top-voted requests every sprint planning cycle and posts roadmap updates there.",
    keywords: [
      "feature request",
      "suggest a feature",
      "roadmap",
      "would be nice if",
      "please add",
      "new feature",
    ],
  },
];

/**
 * Deterministic keyword/substring scoring search over the FAQ knowledge
 * base. No embeddings or external calls - this keeps the tool fast,
 * predictable, and easy to reason about in the agent trace.
 */
export function searchFaq(query: string, limit = 3): FaqMatch[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = normalizedQuery.split(/\W+/).filter(Boolean);

  const scored = FAQ_ENTRIES.map((entry) => {
    let score = 0;

    // Strong signal: one of the entry's keyword phrases appears verbatim
    // in the query (or vice versa for short queries).
    for (const keyword of entry.keywords) {
      const kw = keyword.toLowerCase();
      if (normalizedQuery.includes(kw)) {
        score += 5;
      } else if (kw.includes(normalizedQuery) && normalizedQuery.length > 3) {
        score += 3;
      }
    }

    // Weaker signal: individual query token overlaps with a keyword token
    // or a word in the question text.
    const questionLower = entry.question.toLowerCase();
    for (const token of queryTokens) {
      if (token.length < 3) continue;
      if (questionLower.includes(token)) {
        score += 1;
      }
      for (const keyword of entry.keywords) {
        if (keyword.toLowerCase().includes(token)) {
          score += 1;
        }
      }
    }

    return {
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      score,
    };
  });

  return scored
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
