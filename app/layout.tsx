import { BotIdClient } from "botid/client";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { defaultOgImage, siteOpenGraph } from "@/lib/shared";

// paths whose requests carry a BotID challenge token, verified in the route.
// checkLevel must match the server's checkBotId() call exactly.
const protectedRoutes = [
  {
    path: "/api/chat",
    method: "POST",
    advancedOptions: { checkLevel: "deepAnalysis" as const },
  },
];

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // pin to the canonical domain so canonical links and OG/Twitter image URLs
  // always resolve to docs.kernel.sh — not a per-deploy *.vercel.app host
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://docs.kernel.sh",
  ),
  title: {
    template: "%s - Kernel",
    default: "Kernel Documentation",
  },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    ...siteOpenGraph,
    // site-wide fallback share image; content pages override with their own
    images: defaultOgImage,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GVEXRLYSN4"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GVEXRLYSN4');`}
        </Script>
      </body>
    </html>
  );
}
