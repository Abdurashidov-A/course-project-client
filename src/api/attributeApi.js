import { api } from "./api";

export async function getAttributes(params = {}) {
  const response = await api.get("/api/attributes", { params });

  return response.data;
}

export async function createAttribute(attributeData) {
  const response = await api.post("/api/attributes", attributeData);

  return response.data;
}

export async function deleteAttributes(ids) {
  const response = await api.delete("/api/attributes", {
    data: { ids },
  });

  return response.data;
}

export async function updateAttribute(id, attributeData) {
  const response = await api.put(`/api/attributes/${id}`, attributeData);

  return response.data;
}
