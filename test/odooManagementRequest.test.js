import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createPositionOdooManagementApi,
  getOdooManagementErrorDetails,
} from "../src/api/odooManagementRequest.js";
import {
  createInitialOdooTokenState,
  odooTokenReducer,
} from "../src/components/odooTokenState.js";

function createFakeApiClient() {
  const calls = [];
  const response = { data: { token: null } };

  return {
    calls,
    client: {
      get: async (...arguments_) => {
        calls.push({ method: "get", arguments: arguments_ });
        return response;
      },
      post: async (...arguments_) => {
        calls.push({ method: "post", arguments: arguments_ });
        return response;
      },
      patch: async (...arguments_) => {
        calls.push({ method: "patch", arguments: arguments_ });
        return response;
      },
    },
  };
}

test("management requests rely on the shared authenticated API client", async () => {
  const { calls, client } = createFakeApiClient();
  const managementApi = createPositionOdooManagementApi(client);

  await managementApi.getPositionOdooToken(8);
  await managementApi.generatePositionOdooToken(8, 2);
  await managementApi.revokePositionOdooToken(8, 3);

  assert.deepEqual(calls, [
    {
      method: "get",
      arguments: ["/api/positions/8/odoo-token"],
    },
    {
      method: "post",
      arguments: ["/api/positions/8/odoo-token", { version: 2 }],
    },
    {
      method: "patch",
      arguments: [
        "/api/positions/8/odoo-token/revoke",
        { version: 3 },
      ],
    },
  ]);
});

test("closing the modal clears token and one-time raw token state", () => {
  const populatedState = {
    ...createInitialOdooTokenState(),
    token: { version: 2 },
    rawToken: "one-time-token",
    hasLoadedToken: true,
  };

  assert.deepEqual(
    odooTokenReducer(populatedState, { type: "CLOSE" }),
    createInitialOdooTokenState(),
  );
});

test("management UI contains no credential workflow or browser persistence", async () => {
  const implementationFiles = await Promise.all(
    [
      "src/api/odooManagementRequest.js",
      "src/api/odooApi.js",
      "src/components/OdooTokenModal.jsx",
      "src/components/odooTokenState.js",
      "src/i18n/translations.js",
    ].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")),
  );
  const implementation = implementationFiles.join("\n");
  const globalApiSource = await readFile(
    new URL("../src/api/api.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    implementation,
    /ODOO_MANAGEMENT_CREDENTIAL|x-odoo-management-credential|managementCredential|Management Credential/,
  );
  assert.doesNotMatch(
    implementation,
    /localStorage|sessionStorage|document\.cookie|VITE_|console\./,
  );
  assert.doesNotMatch(globalApiSource, /x-odoo-management-credential/);
  assert.match(globalApiSource, /x-dev-user-id/);
  assert.doesNotMatch(implementation, /useQuery|useMutation|queryClient/);
});

test("the modal loads token status automatically when opened", async () => {
  const modalSource = await readFile(
    new URL("../src/components/OdooTokenModal.jsx", import.meta.url),
    "utf8",
  );

  assert.match(modalSource, /useEffect\(\(\) =>/);
  assert.match(modalSource, /if \(!open \|\| !positionId\)/);
  assert.match(modalSource, /void loadToken\(positionId\)/);
  assert.doesNotMatch(modalSource, /Load Token Status|loadStatus/);
});

test("401 and 403 errors map to safe authorization messages", () => {
  assert.deepEqual(
    getOdooManagementErrorDetails({ response: { status: 401 } }),
    {
      key: "odooToken.authenticationRequired",
      fallback: "Please sign in again to manage Odoo tokens",
    },
  );
  assert.deepEqual(
    getOdooManagementErrorDetails({ response: { status: 403 } }),
    {
      key: "odooToken.accessDenied",
      fallback: "Only recruiters and administrators can manage Odoo tokens",
    },
  );
});
