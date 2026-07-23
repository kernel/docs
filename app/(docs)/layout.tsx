import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { MessageCircleIcon } from "lucide-react";
import {
  AISearch,
  AISearchPanel,
  AISearchTrigger,
} from "@/components/ai/search";
import { cn } from "@/lib/cn";
import { baseOptions } from "@/lib/layout.shared";
import { buildTree } from "@/lib/tree";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <DocsLayout tree={buildTree()} tabMode="navbar" {...baseOptions()}>
      <AISearch>
        <AISearchPanel />
        <AISearchTrigger
          position="float"
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "text-fd-muted-foreground rounded-2xl",
            }),
          )}
        >
          <MessageCircleIcon className="size-4.5" />
          Ask AI
        </AISearchTrigger>
      </AISearch>

      {children}
    </DocsLayout>
  );
}
