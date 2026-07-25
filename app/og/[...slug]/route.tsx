import { generate as DefaultImage } from "fumadocs-ui/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { appName } from "@/lib/shared";
import { apiSource, getApiPageImage, getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/[...slug]">,
) {
  const { slug } = await params;
  const key = slug.slice(0, -1);
  // content pages resolve directly; api-reference images carry the prefix and
  // resolve against apiSource (with the prefix stripped)
  const page =
    source.getPage(key) ??
    (key[0] === "api-reference" ? apiSource.getPage(key.slice(1)) : null);
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site={appName}
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return [
    ...source.getPages().map((page) => ({
      lang: page.locale,
      slug: getPageImage(page).segments,
    })),
    ...apiSource.getPages().map((page) => ({
      lang: page.locale,
      slug: getApiPageImage(page).segments,
    })),
  ];
}
