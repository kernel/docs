import { DocsBody, DocsPage } from "fumadocs-ui/layouts/notebook/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenAPIPage } from "@/components/api-page";
import { SocialFooter } from "@/components/social-footer";
import { apiSource } from "@/lib/source";

export default async function Page(
  props: PageProps<"/api-reference/[[...slug]]">,
) {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);
  if (!page) notFound();

  return (
    <DocsPage toc={page.data.toc} footer={{ children: <SocialFooter /> }}>
      <DocsBody>
        <OpenAPIPage {...page.data.getOpenAPIPageProps()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return apiSource.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/api-reference/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}
