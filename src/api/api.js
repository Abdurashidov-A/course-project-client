import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("cvms_user");

  if (!savedUser) {
    return config;
  }

  try {
    const user = JSON.parse(savedUser);

    if (user?.id) {
      config.headers["x-dev-user-id"] = user.id;
    }
  } catch {
    localStorage.removeItem("cvms_user");
  }

  return config;
});
