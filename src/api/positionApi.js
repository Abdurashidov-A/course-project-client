import { api } from "./api";

export async function getPositions() {
  const response = await api.get("/api/positions");

  return response.data;
}

export async function createPosition(positionData) {
  const response = await api.post("/api/positions", positionData);

  return response.data;
}

export async function duplicatePosition(id) {
  const response = await api.post(`/api/positions/${id}/duplicate`);

  return response.data;
}

export async function deletePositions(ids) {
  const response = await api.delete("/api/positions", {
    data: { ids },
  });

  return response.data;
}

export async function updatePosition(id, positionData) {
  const response = await api.put(`/api/positions/${id}`, positionData);

  return response.data;
}
