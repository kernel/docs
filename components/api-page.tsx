"use client";

import { createOpenAPIPage } from "fumadocs-openapi/ui";

export const OpenAPIPage = createOpenAPIPage({
  // endpoint docs + code samples only; flip to true for the interactive playground
  playground: { enabled: false },
});
