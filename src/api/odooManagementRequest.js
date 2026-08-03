export function getOdooManagementErrorDetails(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return {
      key: "odooToken.authenticationRequired",
      fallback: "Please sign in again to manage Odoo tokens",
    };
  }

  if (status === 403) {
    return {
      key: "odooToken.accessDenied",
      fallback: "Only recruiters and administrators can manage Odoo tokens",
    };
  }

  return {
    key: "odooToken.managementError",
    fallback: "Failed to manage the Odoo token",
  };
}

export function createPositionOdooManagementApi(apiClient) {
  return {
    async getPositionOdooToken(positionId) {
      const response = await apiClient.get(
        `/api/positions/${positionId}/odoo-token`,
      );

      return response.data;
    },

    async generatePositionOdooToken(positionId, version) {
      const response = await apiClient.post(
        `/api/positions/${positionId}/odoo-token`,
        version === undefined ? {} : { version },
      );

      return response.data;
    },

    async revokePositionOdooToken(positionId, version) {
      const response = await apiClient.patch(
        `/api/positions/${positionId}/odoo-token/revoke`,
        { version },
      );

      return response.data;
    },
  };
}
