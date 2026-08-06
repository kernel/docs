import type { MetadataRoute } from "next";
import { apiSource, source } from "@/lib/source";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://docs.kernel.sh";

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (path: string) => new URL(path, SITE_URL).toString();

  const contentPages = source
    .getPages()
    // skip external-link stubs (frontmatter `url` redirects off-site)
    .filter((page) => !page.data.url)
    .map((page) => ({
      url: abs(page.url),
      changeFrequency: "weekly" as const,
      priority: page.url === "/" ? 1 : 0.6,
    }));

  const apiPages = apiSource.getPages().map((page) => ({
    url: abs(page.url),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...contentPages, ...apiPages];
}
