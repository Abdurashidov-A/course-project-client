import { api } from "./api";

export async function devLogin(email) {
  const response = await api.post("/api/auth/dev-login", {
    email,
  });

  return response.data?.user;
}
