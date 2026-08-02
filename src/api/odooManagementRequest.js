const ODOO_MANAGEMENT_CREDENTIAL_HEADER =
  "x-odoo-management-credential";

export function normalizeOdooManagementCredential(credential) {
  return typeof credential === "string" ? credential.trim() : "";
}

export function createOdooManagementRequestConfig(credential) {
  const normalizedCredential = normalizeOdooManagementCredential(credential);

  if (!normalizedCredential) {
    return {};
  }

  return {
    headers: {
      [ODOO_MANAGEMENT_CREDENTIAL_HEADER]: normalizedCredential,
    },
  };
}

export function getOdooManagementErrorDetails(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return {
      key: "odooToken.invalidCredential",
      fallback: "Invalid management credential",
    };
  }

  if (status === 503) {
    return {
      key: "odooToken.notConfigured",
      fallback: "Odoo management API is not configured",
    };
  }

  return {
    key: "odooToken.managementError",
    fallback: "Failed to manage the Odoo token",
  };
}

export function createPositionOdooManagementApi(apiClient) {
  return {
    async getPositionOdooToken(positionId, credential) {
      const response = await apiClient.get(
        `/api/positions/${positionId}/odoo-token`,
        createOdooManagementRequestConfig(credential),
      );

      return response.data;
    },

    async generatePositionOdooToken(positionId, version, credential) {
      const response = await apiClient.post(
        `/api/positions/${positionId}/odoo-token`,
        version === undefined ? {} : { version },
        createOdooManagementRequestConfig(credential),
      );

      return response.data;
    },

    async revokePositionOdooToken(positionId, version, credential) {
      const response = await apiClient.patch(
        `/api/positions/${positionId}/odoo-token/revoke`,
        { version },
        createOdooManagementRequestConfig(credential),
      );

      return response.data;
    },
  };
}
