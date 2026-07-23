import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";
import { remarkMintlifyCode } from "./lib/remark-mintlify-code";

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // Mintlify-era frontmatter keys kept for compatibility:
    // sidebarTitle (sidebar label), url (external sidebar links), mode (layout)
    schema: pageSchema.extend({
      sidebarTitle: z.string().optional(),
      url: z.string().optional(),
      mode: z.enum(["wide", "custom", "center"]).optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // must run before the default remarkCodeTab so Mintlify fence titles
    // are converted to tab attributes first
    remarkPlugins: (v) => [remarkMintlifyCode, ...v],
  },
});
