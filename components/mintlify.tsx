import Link from "fumadocs-core/link";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Cards } from "fumadocs-ui/components/card";
import { Step as FumaStep, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Mintlify MDX components mapped to fumadocs equivalents, registered under
 * their Mintlify names so existing content renders unchanged.
 */

export function Info(props: { children: ReactNode }) {
  return <Callout type="info">{props.children}</Callout>;
}

export function Note(props: { children: ReactNode }) {
  return <Callout type="info">{props.children}</Callout>;
}

export function Tip(props: { children: ReactNode }) {
  return <Callout type="idea">{props.children}</Callout>;
}

export function Warning(props: { children: ReactNode }) {
  return <Callout type="warn">{props.children}</Callout>;
}

export function Check(props: { children: ReactNode }) {
  return <Callout type="success">{props.children}</Callout>;
}

interface MintCardProps {
  title: string;
  href?: string;
  icon?: ReactNode;
  img?: string;
  horizontal?: boolean;
  children?: ReactNode;
}

export function Card({ title, href, img, children }: MintCardProps) {
  // Mintlify icons are Font Awesome names; fumadocs expects React nodes, so
  // string icons are dropped. Mintlify order: artwork, then title, then body,
  // with no hover wash.
  const Comp = href ? Link : "div";
  return (
    <Comp
      href={href}
      data-card
      className="not-prose block rounded-xl border bg-fd-card p-4 text-fd-card-foreground"
    >
      {img ? (
        // biome-ignore lint/performance/noImgElement: content-supplied art, unoptimized svg
        <img src={img} alt="" className="mb-3 w-full" />
      ) : null}
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <div className="prose-no-margin text-sm text-fd-muted-foreground empty:hidden">
        {children}
      </div>
    </Comp>
  );
}

// static map so Tailwind sees the class names at build time
const colsClass: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export function CardGroup(props: {
  cols?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Cards className={cn(props.cols && colsClass[props.cols], props.className)}>
      {props.children}
    </Cards>
  );
}

export const Columns = CardGroup;

interface MintTabProps {
  title: string;
  children: ReactNode;
}

export function MintlifyTabs(props: { children: ReactNode }) {
  const items = Children.toArray(props.children).flatMap((child) =>
    isValidElement<MintTabProps>(child) && child.props.title
      ? [child.props.title]
      : [],
  );

  return (
    <Tabs items={items}>
      {Children.map(props.children, (child) =>
        isValidElement<MintTabProps>(child) ? (
          <Tab value={child.props.title}>{child.props.children}</Tab>
        ) : (
          child
        ),
      )}
    </Tabs>
  );
}

export function MintlifyTab(props: MintTabProps) {
  // replaced by MintlifyTabs; never rendered directly
  return props.children;
}

export { Steps };

export function Step(props: { title?: string; children: ReactNode }) {
  return (
    <FumaStep>
      {props.title ? <h3>{props.title}</h3> : null}
      {props.children}
    </FumaStep>
  );
}

export function AccordionGroup(props: ComponentProps<typeof Accordions>) {
  return <Accordions {...props} />;
}

export function MintlifyAccordion(props: {
  title: string;
  children: ReactNode;
}) {
  // Mintlify allows standalone <Accordion>; base-ui requires a root wrapper
  return (
    <Accordions>
      <Accordion title={props.title}>{props.children}</Accordion>
    </Accordions>
  );
}

export function Frame(props: { caption?: string; children: ReactNode }) {
  return (
    <figure className="not-prose rounded-lg border bg-fd-card p-2 [&_img]:rounded-md">
      {props.children}
      {props.caption ? (
        <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">
          {props.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function Update(props: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-2 border-b py-6 md:flex-row md:gap-6">
      <div className="shrink-0 md:w-40">
        <span className="rounded-lg border bg-fd-card px-2 py-1 text-sm font-medium">
          {props.label}
        </span>
        {props.description ? (
          <p className="mt-2 text-sm text-fd-muted-foreground">
            {props.description}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  );
}
