import type { ReactNode } from "react";

// del is abbreviated like the Mintlify API list; others use the verb as-is
const LABEL: Record<string, string> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "del",
};

const BG: Record<string, string> = {
  GET: "bg-green-600 dark:bg-green-500",
  POST: "bg-blue-600 dark:bg-blue-500",
  PUT: "bg-yellow-600 dark:bg-yellow-500",
  PATCH: "bg-orange-600 dark:bg-orange-500",
  DELETE: "bg-red-600 dark:bg-red-500",
};

/**
 * Sidebar label for an API endpoint: a filled, fixed-width method badge
 * followed by the operation summary, matching the Mintlify API list. Replaces
 * fumadocs' right-aligned coloured-text method label.
 */
export function apiSidebarLabel(
  method: string,
  name: ReactNode,
  deprecated?: boolean,
): ReactNode {
  const m = method.toUpperCase();
  return (
    <>
      <span
        className={`mt-0.5 w-11 shrink-0 self-start px-1 py-0.5 text-center font-mono text-[0.7rem] font-medium text-white ${BG[m] ?? "bg-fd-muted-foreground"}`}
      >
        {LABEL[m] ?? m.toLowerCase()}
      </span>
      <span className={deprecated ? "line-through" : undefined}>{name}</span>
    </>
  );
}
