import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createOdooManagementRequestConfig,
  createPositionOdooManagementApi,
  getOdooManagementErrorDetails,
} from "../src/api/odooManagementRequest.js";
import {
  createInitialOdooTokenState,
  odooTokenReducer,
} from "../src/components/odooTokenState.js";

const MANAGEMENT_HEADER = "x-odoo-management-credential";

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

test("management requests send the credential in their scoped header", async () => {
  const { calls, client } = createFakeApiClient();
  const managementApi = createPositionOdooManagementApi(client);

  await managementApi.getPositionOdooToken(8, "demo-management-credential");
  await managementApi.generatePositionOdooToken(
    8,
    2,
    "demo-management-credential",
  );
  await managementApi.revokePositionOdooToken(
    8,
    3,
    "demo-management-credential",
  );

  assert.equal(calls.length, 3);
  for (const call of calls) {
    const config = call.arguments.at(-1);
    assert.deepEqual(config.headers, {
      [MANAGEMENT_HEADER]: "demo-management-credential",
    });
  }
});

test("empty management credential does not create a header", () => {
  assert.deepEqual(createOdooManagementRequestConfig(""), {});
  assert.deepEqual(createOdooManagementRequestConfig("   "), {});
  assert.deepEqual(createOdooManagementRequestConfig(undefined), {});
});

test("closing the modal clears credential and token state", () => {
  const populatedState = {
    ...createInitialOdooTokenState(),
    managementCredential: "private-management-credential",
    token: { version: 2 },
    rawToken: "one-time-token",
    hasLoadedToken: true,
  };

  assert.deepEqual(
    odooTokenReducer(populatedState, { type: "CLOSE" }),
    createInitialOdooTokenState(),
  );
});

test("management credential is not persisted or added globally", async () => {
  const files = await Promise.all(
    [
      "src/api/odooManagementRequest.js",
      "src/api/odooApi.js",
      "src/components/OdooTokenModal.jsx",
      "src/components/odooTokenState.js",
    ].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")),
  );
  const implementation = files.join("\n");
  const globalApiSource = await readFile(
    new URL("../src/api/api.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    implementation,
    /localStorage|sessionStorage|document\.cookie|VITE_|console\./,
  );
  assert.doesNotMatch(globalApiSource, /x-odoo-management-credential/);
  assert.doesNotMatch(implementation, /useQuery|useMutation|queryClient/);
});

test("401 and 503 errors map to safe messages", () => {
  assert.deepEqual(
    getOdooManagementErrorDetails({ response: { status: 401 } }),
    {
      key: "odooToken.invalidCredential",
      fallback: "Invalid management credential",
    },
  );
  assert.deepEqual(
    getOdooManagementErrorDetails({ response: { status: 503 } }),
    {
      key: "odooToken.notConfigured",
      fallback: "Odoo management API is not configured",
    },
  );
});
