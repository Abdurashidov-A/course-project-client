import { api } from "./api";

export async function getAttributes() {
  const response = await api.get("/api/attributes");

  return response.data;
}

export async function createAttribute(attributeData) {
  const response = await api.post("/api/attributes", attributeData);

  return response.data;
}
