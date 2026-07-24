import { api } from "./api";

export async function getAdminUsers(params = {}) {
  const response = await api.get("/api/admin/users", {
    params,
  });

  return response.data;
}

export async function updateAdminUserRole(userId, payload) {
  const response = await api.patch(`/api/admin/users/${userId}/role`, payload);

  return response.data;
}

export async function updateAdminUserStatus(userId, payload) {
  const response = await api.patch(`/api/admin/users/${userId}/status`, payload);

  return response.data;
}

export async function deleteUsers(ids) {
  const response = await api.delete("/api/admin/users", {
    data: { ids },
  });

  return response.data;
}
