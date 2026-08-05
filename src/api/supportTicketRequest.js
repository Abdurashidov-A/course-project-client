export function createSupportTicketApi(apiClient) {
  return {
    async submitSupportTicket(payload, options = {}) {
      const response = await apiClient.post("/api/support-tickets", payload, {
        signal: options.signal,
      });

      return response.data;
    },
  };
}
