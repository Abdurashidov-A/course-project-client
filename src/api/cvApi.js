import { api } from "./api";

export async function getMyCvs() {
  const response = await api.get("/api/cvs/my");

  return response.data;
}

export async function getCvById(cvId) {
  const response = await api.get(`/api/cvs/${cvId}`);

  return response.data;
}

export async function createCv(positionId) {
  const response = await api.post("/api/cvs", {
    positionId,
  });

  return response.data;
}
