export const appName = "Kernel";
export const docsRoute = "/";
export const docsImageRoute = "/og";
export const docsContentRoute = "/llms.mdx";

// site-wide OG default image (the home card)
export const defaultOgImage = `${docsImageRoute}/image.png`;
// Open Graph fields every page shares. Next replaces (not deep-merges) the
// openGraph object per segment, so pages spread this into their own openGraph
// rather than inheriting it from the root layout.
export const siteOpenGraph = {
  type: "website" as const,
  siteName: appName,
};

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: "kernel",
  repo: "docs",
  branch: "main",
};
