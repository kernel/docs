import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async rewrites() {
    // agents can fetch raw markdown by appending .md/.mdx to any page URL
    return [
      { source: "/:path(.+)\\.md", destination: "/llms.mdx/:path/content.md" },
      { source: "/:path(.+)\\.mdx", destination: "/llms.mdx/:path/content.md" },
    ];
  },
  async redirects() {
    // ported from docs.json (Mintlify)
    return [
      {
        source: "/careers/intro",
        destination: "https://jobs.ashbyhq.com/usekernel",
        permanent: false,
      },
      {
        source: "/careers/infra-engineer",
        destination: "https://jobs.ashbyhq.com/usekernel",
        permanent: false,
      },
      {
        source: "/careers/backend-engineer",
        destination: "https://jobs.ashbyhq.com/usekernel",
        permanent: false,
      },
      {
        source: "/careers/engineer-new-grad",
        destination: "https://jobs.ashbyhq.com/usekernel",
        permanent: false,
      },
      {
        source: "/careers/customer-engineer",
        destination: "https://jobs.ashbyhq.com/usekernel",
        permanent: false,
      },
      {
        source: "/auth/agent/overview",
        destination: "/auth/overview",
        permanent: false,
      },
      {
        source: "/auth/agent/hosted-ui",
        destination: "/auth/hosted-ui",
        permanent: false,
      },
      {
        source: "/auth/agent/programmatic",
        destination: "/auth/programmatic",
        permanent: false,
      },
      { source: "/auth/agent/faq", destination: "/auth/faq", permanent: false },
      {
        source: "/browsers/hardware-acceleration",
        destination: "/browsers/gpu-acceleration",
        permanent: false,
      },
      {
        source: "/integrations/computer-use",
        destination: "/integrations/computer-use/overview",
        permanent: false,
      },
      {
        source: "/browsers/create-a-browser",
        destination: "/introduction/create",
        permanent: false,
      },
      {
        source: "/browsers/pools/scaling",
        destination: "/introduction/scale",
        permanent: false,
      },
      { source: "/introduction", destination: "/", permanent: false },
      { source: "/quickstart", destination: "/", permanent: false },
      { source: "/home", destination: "/", permanent: false },
      {
        source: "/llm.md",
        destination: "/integrations/stripe-projects",
        permanent: false,
      },
      {
        source: "/llm-browser.md",
        destination: "/integrations/stripe-projects-browser",
        permanent: false,
      },
    ];
  },
};

export default withMDX(config);
