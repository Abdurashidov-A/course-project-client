import { api } from "./api";

export async function getProfileAttributes() {
  const response = await api.get("/api/profile-attributes");

  return response.data;
}

export async function saveProfileAttribute(attributeId, profileAttributeData) {
  const response = await api.put(
    `/api/profile-attributes/${attributeId}`,
    profileAttributeData,
  );

  return response.data;
}

export async function deleteProfileAttributes(ids) {
  const response = await api.delete("/api/profile-attributes", {
    data: { ids },
  });

  return response.data;
}
