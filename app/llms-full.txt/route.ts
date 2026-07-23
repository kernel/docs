import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  // one page failing to render shouldn't drop the entire corpus — skip it
  const pages = source.getPages();
  const results = await Promise.allSettled(pages.map(getLLMText));
  const scanned = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return [r.value];
    console.error(`[llms-full] skipped ${pages[i].url}:`, r.reason);
    return [];
  });

  return new Response(scanned.join("\n\n"));
}
