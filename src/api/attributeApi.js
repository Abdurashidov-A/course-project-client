import { api } from "./api";

export async function getAttributes() {
  const response = await api.get("/api/attributes");

  return response.data;
}
