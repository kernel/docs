import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import {
  AccordionGroup,
  Card,
  CardGroup,
  Check,
  Columns,
  Frame,
  Info,
  MintlifyAccordion,
  MintlifyTab,
  MintlifyTabs,
  Note,
  Step,
  Steps,
  Tip,
  Update,
  Warning,
} from "./mintlify";
import { CopyPromptButton } from "./snippets/copy-prompt-button";
import { PricingCalculator } from "./snippets/pricing-calculator";
import { YouTubeVideo } from "./snippets/youtube-video";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // click-to-zoom on content images (screenshots, diagrams, demo gifs).
    // MDX types src as string|Blob; ImageZoom wants string|StaticImport.
    img: (props) => (
      <ImageZoom {...(props as ComponentProps<typeof ImageZoom>)} />
    ),
    // Mintlify component names, so existing content renders unchanged
    Info,
    Note,
    Tip,
    Warning,
    Check,
    Card,
    CardGroup,
    Columns,
    Steps,
    Step,
    Tabs: MintlifyTabs,
    Tab: MintlifyTab,
    AccordionGroup,
    Accordion: MintlifyAccordion,
    Frame,
    Update,
    // components formerly in /snippets
    CopyPromptButton,
    PricingCalculator,
    YouTubeVideo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
