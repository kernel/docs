import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  // skip external-link stubs (frontmatter `url`, no real body); one page
  // failing to render shouldn't drop the entire corpus either
  const pages = source.getPages().filter((page) => !page.data.url);
  const results = await Promise.allSettled(pages.map(getLLMText));
  const scanned = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return [r.value];
    console.error(`[llms-full] skipped ${pages[i].url}:`, r.reason);
    return [];
  });

  return new Response(scanned.join("\n\n"));
}
