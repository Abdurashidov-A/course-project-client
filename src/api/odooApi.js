import { api } from "./api";

export async function getPositionOdooToken(positionId) {
  const response = await api.get(`/api/positions/${positionId}/odoo-token`);

  return response.data;
}

export async function generatePositionOdooToken(positionId, version) {
  const response = await api.post(
    `/api/positions/${positionId}/odoo-token`,
    version === undefined ? {} : { version },
  );

  return response.data;
}

export async function revokePositionOdooToken(positionId, version) {
  const response = await api.patch(
    `/api/positions/${positionId}/odoo-token/revoke`,
    { version },
  );

  return response.data;
}
