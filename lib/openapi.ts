import { createOpenAPI } from "fumadocs-openapi/server";

// same Stainless-generated spec the Mintlify site used
export const OPENAPI_SPEC_URL =
  "https://app.stainless.com/api/spec/documented/kernel/openapi.documented.yml";

export const openapi = createOpenAPI({
  input: [OPENAPI_SPEC_URL],
});
