import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyTicket } from "./classify.ts";

describe("classifyTicket priority", () => {
  it("treats a wide outage as urgent even without urgency words", () => {
    const result = classifyTicket(
      "Our production integration started failing about 20 minutes ago. Every request to your API returns a 503 and our checkout is down for all customers. Is there an outage?",
    );
    assert.equal(result.category, "bug");
    assert.equal(result.priority, "urgent");
    assert.match(result.rationale, /outage/);
  });

  it("keeps a single-user breakage at high", () => {
    const result = classifyTicket("The export button is not working for me since yesterday.");
    assert.equal(result.priority, "high");
  });

  it("does not read 'download' or 'dropdown' as 'down'", () => {
    const result = classifyTicket(
      "Where can I download my invoices? The dropdown on the billing page lists all users.",
    );
    assert.notEqual(result.priority, "urgent");
  });

  it("doesn't escalate wide-impact words without anything being down", () => {
    const result = classifyTicket(
      "Everyone on our team loves it. It would be great if we could schedule reports to email all users on Mondays.",
    );
    assert.equal(result.category, "feature-request");
    assert.equal(result.priority, "low");
  });

  it("still escalates explicit urgency", () => {
    const result = classifyTicket(
      "Hi, I was charged twice for my subscription this month and I need this fixed ASAP.",
    );
    assert.equal(result.category, "billing");
    assert.equal(result.priority, "urgent");
  });

  it("matches keywords typed with curly apostrophes", () => {
    const result = classifyTicket("I can’t log in after switching phones.");
    assert.equal(result.category, "account");
    assert.equal(result.priority, "high");
  });
});
