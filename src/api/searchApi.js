import { api } from "./api";
import { searchPublic } from "./publicApi";

export async function searchGlobal(query) {
  const savedUser = localStorage.getItem("cvms_user");

  if (!savedUser) {
    return searchPublic(query);
  }

  const response = await api.get("/api/search", {
    params: {
      q: query,
    },
  });

  return response.data;
}
