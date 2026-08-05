export const SUPPORT_TICKET_PRIORITIES = ["High", "Average", "Low"];
export const DEFAULT_SUPPORT_TICKET_PRIORITY = "Average";
export const MIN_SUPPORT_SUMMARY_LENGTH = 5;
export const MAX_SUPPORT_SUMMARY_LENGTH = 2_000;

export function isSupportTicketsEnabled(value) {
  return value === true || value === "true";
}

export function normalizeSupportPositionId(value) {
  const normalized = typeof value === "string" ? Number(value) : value;

  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

export function selectSupportPositionId({
  routePositionId = null,
  pagePositionId = null,
} = {}) {
  return (
    normalizeSupportPositionId(routePositionId) ||
    normalizeSupportPositionId(pagePositionId)
  );
}

export function getSupportSummaryValidationError(value) {
  const summary = typeof value === "string" ? value.trim() : "";

  if (!summary) {
    return "required";
  }

  if (
    summary.length < MIN_SUPPORT_SUMMARY_LENGTH ||
    summary.length > MAX_SUPPORT_SUMMARY_LENGTH
  ) {
    return "length";
  }

  return null;
}

export function buildSupportTicketPayload({
  summary,
  priority,
  positionId,
  link,
}) {
  const normalizedSummary = typeof summary === "string" ? summary.trim() : "";

  if (getSupportSummaryValidationError(normalizedSummary)) {
    throw new TypeError("Invalid support ticket summary");
  }

  if (!SUPPORT_TICKET_PRIORITIES.includes(priority)) {
    throw new TypeError("Invalid support ticket priority");
  }

  const normalizedLink = new URL(link).toString();
  const normalizedPositionId = normalizeSupportPositionId(positionId);
  const payload = {
    summary: normalizedSummary,
    priority,
    link: normalizedLink,
  };

  if (normalizedPositionId) {
    payload.positionId = normalizedPositionId;
  }

  return payload;
}

export function getSupportTicketErrorDetails(error) {
  const status = error?.response?.status;

  if (status === 400) {
    return {
      key: "supportTicket.invalidRequest",
      fallback: "Please check the support ticket details",
    };
  }

  if (status === 401) {
    return {
      key: "supportTicket.authenticationRequired",
      fallback: "Please sign in again to submit a support ticket",
    };
  }

  if (status === 403) {
    return {
      key: "supportTicket.forbidden",
      fallback: "Support ticket submission is not available for this account",
    };
  }

  if (status === 502 || status === 503) {
    return {
      key: "supportTicket.serviceUnavailable",
      fallback: "Support service is temporarily unavailable",
    };
  }

  return {
    key: "supportTicket.networkError",
    fallback: "Could not submit the support ticket. Please try again.",
  };
}
