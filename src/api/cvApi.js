import { api } from "./api";

export async function getMyCvs() {
  const response = await api.get("/api/cvs/my");

  return response.data;
}

export async function getCvById(cvId) {
  const response = await api.get(`/api/cvs/${cvId}`);

  return response.data;
}

export async function getPositionCvs(positionId) {
  const response = await api.get(`/api/positions/${positionId}/cvs`);

  return response.data;
}

export async function publishCv(cvId, version) {
  const response = await api.patch(`/api/cvs/${cvId}/publish`, {
    version,
  });

  return response.data;
}

export async function likeCv(cvId) {
  const response = await api.post(`/api/cvs/${cvId}/like`);

  return response.data;
}

export async function unlikeCv(cvId) {
  const response = await api.delete(`/api/cvs/${cvId}/like`);

  return response.data;
}

export async function createCv(positionId) {
  const response = await api.post("/api/cvs", {
    positionId,
  });

  return response.data;
}
