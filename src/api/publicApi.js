import { api } from "./api";

export async function getPublicPositions() {
  const response = await api.get("/api/public/positions");
  return response.data;
}

export async function getPublicStats() {
  const response = await api.get("/api/public/stats");
  return response.data;
}

export async function searchPublic(query) {
  const response = await api.get("/api/public/search", {
    params: {
      q: query,
    },
  });

  return response.data;
}
