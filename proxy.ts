import { isMarkdownPreferred } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";

// .md/.mdx suffix rewrites live in next.config.mjs; this proxy only handles
// Accept-header negotiation (agents requesting text/markdown at page URLs)
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isMarkdownPreferred(request) &&
    !pathname.startsWith("/llms.") &&
    !pathname.startsWith("/api/") &&
    !pathname.includes(".")
  ) {
    const slug = pathname === "/" ? "" : pathname;
    return NextResponse.rewrite(
      new URL(`/llms.mdx${slug}/content.md`, request.nextUrl),
    );
  }

  return NextResponse.next();
}
