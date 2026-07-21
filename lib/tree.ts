import type * as PageTree from "fumadocs-core/page-tree";
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

function apiReferenceTab(): PageTree.Folder | undefined {
  const native = apiSource.getPageTree();
  return {
    type: "folder",
    name: "API Reference",
    root: true,
    children: native.children,
  };
}
