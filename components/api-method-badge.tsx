import type { ReactNode } from "react";

// del is abbreviated like the Mintlify API list; others use the verb as-is
const LABEL: Record<string, string> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "del",
};

// muted tint + coloured text — subtle like the prod badges, not loud fills
const STYLE: Record<string, string> = {
  GET: "bg-green-500/10 text-green-700 dark:text-green-400",
  POST: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PUT: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  PATCH: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
};

/**
 * Sidebar label for an API endpoint: a subtle, fixed-width method badge
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
        className={`mt-0.5 w-11 shrink-0 self-start px-1 py-0.5 text-center font-mono text-[0.7rem] font-medium ${STYLE[m] ?? "bg-fd-muted text-fd-muted-foreground"}`}
      >
        {LABEL[m] ?? m.toLowerCase()}
      </span>
      <span className={deprecated ? "line-through" : undefined}>{name}</span>
    </>
  );
}
