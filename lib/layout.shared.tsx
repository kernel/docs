import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
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
