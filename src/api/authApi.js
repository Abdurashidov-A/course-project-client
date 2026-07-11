import { api } from "./api";

export async function devLogin(email) {
  const response = await api.post("/api/auth/dev-login", {
    email,
  });

  return response.data?.user;
}

export async function completeOAuthLogin(token) {
  const response = await api.post("/api/auth/oauth/complete", {
    token,
  });

  return response.data?.user;
}
