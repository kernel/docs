"use client";

import type { OpenAPIV3_2, RenderContext } from "fumadocs-openapi";
import { Callout } from "fumadocs-ui/components/callout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Operation = OpenAPIV3_2.OperationObject;

/**
 * Response section rendered with a status-code dropdown and the selected
 * response's schema shown inline, matching the Mintlify layout. Replaces
 * fumadocs' default per-status accordion, which hides the schema until
 * expanded.
 */
export function ApiResponses({
  operation,
  ctx,
}: {
  operation: Operation;
  ctx: RenderContext;
}) {
  const responses = operation.responses ?? {};
  const statuses = Object.keys(responses);
  const [selected, setSelected] = useState(statuses[0]);
  const [open, setOpen] = useState(false);

  if (statuses.length === 0) return null;

  const status = statuses.includes(selected) ? selected : statuses[0];
  const response = ctx.schema.resolve(responses[status]);
  const contentTypes = response.content ? Object.entries(response.content) : [];
  const [mediaType, media] = contentTypes[0] ?? [];
  const schema = media ? ctx.schema.resolve(media).schema : undefined;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-2">
        <h2 id="response-body" className="my-0! scroll-m-28">
          Response
        </h2>
        <div className="not-prose flex items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="inline-flex items-center gap-1 font-mono text-sm">
              {status}
              <ChevronDown className="size-3.5 text-fd-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-col p-1">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelected(s);
                    setOpen(false);
                  }}
                  className="p-2 text-left font-mono text-sm hover:bg-fd-accent hover:text-fd-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {mediaType ? (
            <span className="font-mono text-sm text-fd-muted-foreground">
              {mediaType}
            </span>
          ) : null}
        </div>
      </div>
      {response.description ? (
        <div className="prose-no-margin mb-4">
          {ctx._default_processMarkdown(response.description)}
        </div>
      ) : null}
      {schema ? (
        <ctx.SchemaUI
          client={{ name: "response", as: "body" }}
          root={schema}
          readOnly
        />
      ) : (
        <Callout type="info">no response body.</Callout>
      )}
    </>
  );
}
