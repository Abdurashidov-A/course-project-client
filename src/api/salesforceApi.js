import { api } from "./api";

export async function exportProfileToSalesforce(
  userId,
  { accountName, phone },
) {
  const response = await api.post(
    `/api/integrations/salesforce/profiles/${encodeURIComponent(userId)}`,
    {
      accountName,
      phone: phone || null,
    },
  );

  return response.data;
}