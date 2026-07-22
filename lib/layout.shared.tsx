import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* docs.json logo config: black on light, white on dark */}
          <img
            src="/logo/black.svg"
            alt={appName}
            className="h-5 dark:hidden"
          />
          <img
            src="/logo/white.svg"
            alt={appName}
            className="hidden h-5 dark:block"
          />
        </>
      ),
    },
    links: [
      { text: "Dashboard", url: "https://dashboard.onkernel.com" },
      { text: "Changelog", url: "https://www.kernel.sh/changelog" },
      { text: "Careers", url: "https://jobs.ashbyhq.com/usekernel" },
      {
        text: "Sign up",
        url: "https://dashboard.onkernel.com/sign-up",
        type: "button",
      },
    ],
    githubUrl: "https://github.com/kernel/docs",
  };
}
