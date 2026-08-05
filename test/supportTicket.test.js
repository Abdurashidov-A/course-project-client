import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createSupportTicketApi } from "../src/api/supportTicketRequest.js";
import {
  buildSupportTicketPayload,
  DEFAULT_SUPPORT_TICKET_PRIORITY,
  getSupportSummaryValidationError,
  getSupportTicketErrorDetails,
  isSupportTicketsEnabled,
  selectSupportPositionId,
} from "../src/components/supportTicketState.js";
import { translations } from "../src/i18n/translations.js";

test("support API uses the shared client, exact path, payload, and AbortSignal", async () => {
  const calls = [];
  const controller = new AbortController();
  const supportApi = createSupportTicketApi({
    async post(...arguments_) {
      calls.push(arguments_);
      return { data: { status: "submitted" } };
    },
  });
  const payload = {
    summary: "Cannot publish my CV",
    priority: "High",
    positionId: 8,
    link: "https://client.example/cvs/1",
  };

  assert.deepEqual(
    await supportApi.submitSupportTicket(payload, {
      signal: controller.signal,
    }),
    { status: "submitted" },
  );
  assert.deepEqual(calls, [
    ["/api/support-tickets", payload, { signal: controller.signal }],
  ]);
});

test("feature flag is hidden by default and enabled only explicitly", () => {
  assert.equal(isSupportTicketsEnabled(undefined), false);
  assert.equal(isSupportTicketsEnabled("false"), false);
  assert.equal(isSupportTicketsEnabled("TRUE"), false);
  assert.equal(isSupportTicketsEnabled("true"), true);
  assert.equal(isSupportTicketsEnabled(true), true);
});

test("summary validation uses trimmed 5 to 2000 character boundaries", () => {
  assert.equal(getSupportSummaryValidationError("   "), "required");
  assert.equal(getSupportSummaryValidationError(" 1234 "), "length");
  assert.equal(getSupportSummaryValidationError(" 12345 "), null);
  assert.equal(getSupportSummaryValidationError("x".repeat(2_000)), null);
  assert.equal(getSupportSummaryValidationError("x".repeat(2_001)), "length");
});

test("payload contains only allowed fields and omits ambiguous position context", () => {
  const withoutPosition = buildSupportTicketPayload({
    summary: "  Cannot publish my CV  ",
    priority: "Average",
    positionId: null,
    link: "https://client.example/dashboard",
    reportedBy: { email: "private@example.com" },
    adminEmails: ["admin@example.com"],
  });
  const withPosition = buildSupportTicketPayload({
    summary: "Position-specific problem",
    priority: "Low",
    positionId: "8",
    link: "https://client.example/positions/8/cvs",
  });

  assert.deepEqual(withoutPosition, {
    summary: "Cannot publish my CV",
    priority: "Average",
    link: "https://client.example/dashboard",
  });
  assert.deepEqual(withPosition, {
    summary: "Position-specific problem",
    priority: "Low",
    link: "https://client.example/positions/8/cvs",
    positionId: 8,
  });
  assert.equal(DEFAULT_SUPPORT_TICKET_PRIORITY, "Average");
});

test("position context requires one valid explicit route or page position", () => {
  assert.equal(selectSupportPositionId(), null);
  assert.equal(selectSupportPositionId({ pagePositionId: 0 }), null);
  assert.equal(selectSupportPositionId({ pagePositionId: 8 }), 8);
  assert.equal(selectSupportPositionId({ routePositionId: "9" }), 9);
  assert.equal(
    selectSupportPositionId({ routePositionId: 9, pagePositionId: 8 }),
    9,
  );
});

test("HTTP and network failures map to safe localized message keys", () => {
  assert.equal(
    getSupportTicketErrorDetails({ response: { status: 400 } }).key,
    "supportTicket.invalidRequest",
  );
  assert.equal(
    getSupportTicketErrorDetails({ response: { status: 401 } }).key,
    "supportTicket.authenticationRequired",
  );
  assert.equal(
    getSupportTicketErrorDetails({ response: { status: 403 } }).key,
    "supportTicket.forbidden",
  );
  assert.equal(
    getSupportTicketErrorDetails({ response: { status: 502 } }).key,
    "supportTicket.serviceUnavailable",
  );
  assert.equal(
    getSupportTicketErrorDetails({ response: { status: 503 } }).key,
    "supportTicket.serviceUnavailable",
  );
  assert.equal(
    getSupportTicketErrorDetails(new Error("PRIVATE_NETWORK_DETAILS")).key,
    "supportTicket.networkError",
  );
});

test("modal and global action preserve local-only, fail-safe UI behavior", async () => {
  const [appSource, modalSource, positionsSource, previewSource] =
    await Promise.all(
      [
        "src/App.jsx",
        "src/components/SupportTicketModal.jsx",
        "src/pages/PositionsPage.jsx",
        "src/pages/CvPreviewPage.jsx",
      ].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")),
    );
  const supportImplementation = `${modalSource}\n${await readFile(
    new URL("../src/api/supportTicketApi.js", import.meta.url),
    "utf8",
  )}\n${await readFile(
    new URL("../src/api/supportTicketRequest.js", import.meta.url),
    "utf8",
  )}`;

  assert.match(appSource, /!isGuest && supportTicketsEnabled/);
  assert.match(appSource, /QuestionCircleOutlined/);
  assert.match(appSource, /window\.location\.href/);
  assert.match(modalSource, /DEFAULT_SUPPORT_TICKET_PRIORITY/);
  assert.match(modalSource, /submissionLockRef = useRef\(false\)/);
  assert.match(
    modalSource,
    /submitMutation\.isPending \|\| submissionLockRef\.current/,
  );
  assert.match(modalSource, /submissionLockRef\.current = true/);
  assert.match(modalSource, /confirmLoading=\{submitMutation\.isPending\}/);
  assert.match(modalSource, /onSuccess:[\s\S]*form\.resetFields\(\)[\s\S]*onClose\(\)/);
  assert.match(modalSource, /onError:[\s\S]*message\.error/);
  const errorHandlerStart = modalSource.indexOf("onError: (error) =>");
  const errorHandlerEnd = modalSource.indexOf("  });", errorHandlerStart);
  assert.ok(errorHandlerStart >= 0 && errorHandlerEnd > errorHandlerStart);
  assert.doesNotMatch(
    modalSource.slice(errorHandlerStart, errorHandlerEnd),
    /form\.resetFields/,
  );
  assert.match(positionsSource, /selectedPositionIds\.length === 1/);
  assert.match(previewSource, /data\?\.position\?\.id/);
  assert.doesNotMatch(
    supportImplementation,
    /localStorage|sessionStorage|document\.cookie|console\.|VITE_|accessToken|adminEmails|reportedBy/,
  );
});

test("all support ticket strings exist in English and Uzbek", () => {
  const keys = [
    "supportTicket.help",
    "supportTicket.create",
    "supportTicket.summary",
    "supportTicket.priority",
    "supportTicket.priorityHigh",
    "supportTicket.priorityAverage",
    "supportTicket.priorityLow",
    "supportTicket.submit",
    "supportTicket.submitting",
    "supportTicket.success",
    "supportTicket.invalidRequest",
    "supportTicket.authenticationRequired",
    "supportTicket.forbidden",
    "supportTicket.serviceUnavailable",
    "supportTicket.networkError",
  ];

  for (const language of ["en", "uz"]) {
    for (const key of keys) {
      assert.equal(typeof translations[language][key], "string");
      assert.ok(translations[language][key].trim());
    }
  }
});
