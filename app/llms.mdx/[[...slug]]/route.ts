import { notFound } from "next/navigation";
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/[[...slug]]">,
) {
  const { slug } = await params;
  const slugs = slug?.slice(0, -1) ?? [];
  // /index.md rewrites here as ["index"], but the home page lives at []
  const page = source.getPage(
    slugs.length === 1 && slugs[0] === "index" ? [] : slugs,
  );
  if (!page) notFound();
  // external-link stubs (frontmatter `url`) have no markdown body; send agents
  // to the real resource, matching the HTML page's redirect
  if (page.data.url) return Response.redirect(page.data.url, 308);

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}

export function generateStaticParams() {
  // don't prerender markdown for external-link stubs; they redirect at runtime
  return source
    .getPages()
    .filter((page) => !page.data.url)
    .map((page) => ({
      lang: page.locale,
      slug: getPageMarkdownUrl(page).segments,
    }));
}
