import { api } from "./api";

export async function getMyProjects() {
  const response = await api.get("/api/projects/my");

  return response.data;
}

export async function createProject(projectData) {
  const response = await api.post("/api/projects", projectData);

  return response.data;
}

export async function updateProject(id, projectData) {
  const response = await api.put(`/api/projects/${id}`, projectData);

  return response.data;
}

export async function deleteProjects(ids) {
  const response = await api.delete("/api/projects", {
    data: { ids },
  });

  return response.data;
}
