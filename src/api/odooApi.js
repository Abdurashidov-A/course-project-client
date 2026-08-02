import { api } from "./api";
import { createPositionOdooManagementApi } from "./odooManagementRequest";

const positionOdooManagementApi = createPositionOdooManagementApi(api);

export const {
  generatePositionOdooToken,
  getPositionOdooToken,
  revokePositionOdooToken,
} = positionOdooManagementApi;
