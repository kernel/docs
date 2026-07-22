import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/notebook/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { OpenInDropdown } from "@/components/page-actions";
import { SocialFooter } from "@/components/social-footer";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";
import { getEyebrow } from "@/lib/tree";

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  // Mintlify url: frontmatter marks a page as an external sidebar link
  if (page.data.url) redirect(page.data.url);

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const eyebrow = getEyebrow(params.slug ?? []);
  // Mintlify's mode: wide widens the content column and drops the TOC
  const full = page.data.full || page.data.mode === "wide";

  return (
    <DocsPage
      toc={page.data.toc}
      full={full}
      breadcrumb={{ enabled: false }}
      footer={{ children: <SocialFooter /> }}
    >
      {eyebrow ? (
        <span className="-mb-4 text-sm font-semibold text-fd-primary">
          {eyebrow}
        </span>
      ) : null}
      <DocsTitle className="text-3xl tracking-tight sm:text-4xl">
        {page.data.title}
      </DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl}>
          Copy page
        </MarkdownCopyButton>
        <OpenInDropdown />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
