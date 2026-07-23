import type * as PageTree from "fumadocs-core/page-tree";
import type { ReactNode } from "react";
import { apiSidebarLabel } from "@/components/api-method-badge";
import docsJson from "../docs.json";
import { apiSource, source } from "./source";

type MintlifyPages = (string | MintlifyGroup)[];

interface MintlifyGroup {
  group: string;
  expanded?: boolean;
  pages: MintlifyPages;
}

interface MintlifyTab {
  tab: string;
  href?: string;
  openapi?: string;
  groups?: { group: string; pages: MintlifyPages }[];
}

function pageNode(id: string): PageTree.Item | undefined {
  const slugs = id === "index" ? [] : id.split("/");
  const page = source.getPage(slugs);
  if (!page) {
    console.warn(`[tree] page listed in docs.json not found: ${id}`);
    return undefined;
  }

  const { sidebarTitle, title, url } = page.data;
  return {
    type: "page",
    name: sidebarTitle ?? title,
    url: url ?? page.url,
    external: url !== undefined,
  };
}

function convertPages(pages: MintlifyPages): PageTree.Node[] {
  const nodes: PageTree.Node[] = [];
  for (const entry of pages) {
    if (typeof entry === "string") {
      const node = pageNode(entry);
      if (node) nodes.push(node);
    } else {
      nodes.push({
        type: "folder",
        name: entry.group,
        defaultOpen: entry.expanded ?? false,
        children: convertPages(entry.pages),
      });
    }
  }
  return nodes;
}

function convertTab(tab: MintlifyTab): PageTree.Folder {
  const children: PageTree.Node[] = [];
  for (const group of tab.groups ?? []) {
    children.push({ type: "separator", name: group.group });
    children.push(...convertPages(group.pages));
  }
  return { type: "folder", name: tab.tab, root: true, children };
}

/**
 * Builds the fumadocs page tree from docs.json, which remains the single
 * source of truth for navigation (same file Mintlify used).
 */
export function buildTree(): PageTree.Root {
  const tabs = docsJson.navigation.tabs as MintlifyTab[];
  const children: PageTree.Node[] = [];

  for (const tab of tabs) {
    // href tabs (Changelog) are rendered as navbar links instead
    if (tab.href) continue;
    // the API Reference tab is generated from the OpenAPI spec, not docs.json
    if (tab.openapi) {
      const node = apiReferenceTab();
      if (node) children.push(node);
      continue;
    }
    children.push(convertTab(tab));
  }

  return { name: "Kernel", children };
}

let eyebrowMap: Map<string, string> | undefined;

/**
 * The innermost docs.json group containing a page — Mintlify renders this as
 * the eyebrow above the page title.
 */
export function getEyebrow(slugs: string[]): string | undefined {
  if (!eyebrowMap) {
    eyebrowMap = new Map();
    const visit = (pages: MintlifyPages, group: string) => {
      for (const entry of pages) {
        if (typeof entry === "string") eyebrowMap?.set(entry, group);
        else visit(entry.pages, entry.group);
      }
    };
    for (const tab of docsJson.navigation.tabs as MintlifyTab[]) {
      for (const group of tab.groups ?? []) visit(group.pages, group.group);
    }
  }
  return eyebrowMap.get(slugs.length === 0 ? "index" : slugs.join("/"));
}

// fumadocs-openapi derives tag section labels via idToTitle(), which splits
// runs of capitals — the "API Keys" tag renders as "A P I Keys". Rejoin any
// run of single capital letters (also covers future acronyms like URL/SDK).
function fixAcronymSpacing(name: ReactNode): ReactNode {
  if (typeof name !== "string") return name;
  return name.replace(/\b[A-Z](?: [A-Z])+\b/g, (run) => run.replace(/ /g, ""));
}

// Rebuild each endpoint's sidebar label as a filled method badge + summary
// (see apiSidebarLabel), and fix acronym spacing on the tag section headings.
function decorateApiTree(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === "folder") {
      return {
        ...node,
        name: fixAcronymSpacing(node.name),
        children: decorateApiTree(node.children),
      };
    }
    if (node.type === "page") {
      const slugs = node.url
        .replace(/^\/api-reference\/?/, "")
        .split("/")
        .filter(Boolean);
      const page = apiSource.getPage(slugs);
      const method = page?.data._openapi.method;
      if (page && method) {
        return {
          ...node,
          name: apiSidebarLabel(
            method,
            page.data.title,
            page.data._openapi.deprecated,
          ),
        };
      }
      return node;
    }
    return { ...node, name: fixAcronymSpacing(node.name) };
  });
}

function apiReferenceTab(): PageTree.Folder | undefined {
  const native = apiSource.getPageTree();
  return {
    type: "folder",
    name: "API Reference",
    root: true,
    children: decorateApiTree(native.children),
  };
}
