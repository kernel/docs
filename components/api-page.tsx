"use client";

import { createOpenAPIPage } from "fumadocs-openapi/ui";
import { ApiResponses } from "./api-responses";

export const OpenAPIPage = createOpenAPIPage({
  // endpoint docs + code samples only; flip to true for the interactive playground
  playground: { enabled: false },
  content: {
    // Replicates the default two-column layout but swaps the collapsed
    // per-status response accordion for a status-code dropdown with the
    // schema shown inline (see ApiResponses).
    renderOperationLayout(slots, { operation, ctx }) {
      return (
        <div className="flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start">
          <div className="min-w-0 flex-1">
            {slots.header}
            {slots.apiPlayground}
            {slots.description}
            {slots.authSchemes}
            {slots.parameters}
            {slots.body}
            {operation.responses ? (
              <ApiResponses operation={operation} ctx={ctx} />
            ) : null}
            {slots.callbacks}
          </div>
          <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
            {slots.apiExample}
          </div>
        </div>
      );
    },
  },
});
