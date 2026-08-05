import { api } from "./api";
import { createSupportTicketApi } from "./supportTicketRequest";

export const { submitSupportTicket } = createSupportTicketApi(api);
