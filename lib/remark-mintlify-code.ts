import type { Code, Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Translates Mintlify code fence conventions to fumadocs ones:
 *
 * - Mintlify treats the fence meta as a bare title, e.g. ```typescript My Title.
 *   fumadocs expects title="My Title".
 * - Inside <CodeGroup>, each block's title becomes its tab label. fumadocs
 *   merges consecutive blocks with tab="..." meta via remarkCodeTab, so the
 *   CodeGroup wrapper is unwrapped and titles become tab attributes.
 */
export function remarkMintlifyCode() {
  return (tree: Root) => {
    visit(tree, "mdxJsxFlowElement", (node, index, parent) => {
      if (node.name !== "CodeGroup" || !parent || index === undefined) return;

      for (const child of node.children) {
        if (child.type !== "code") continue;
        const code = child as Code;
        const label = code.meta?.trim() || code.lang || "Code";
        code.meta = `tab="${label.replace(/"/g, "'")}"`;
      }
      parent.children.splice(index, 1, ...node.children);
    });

    visit(tree, "code", (node) => {
      // shiki language ids are lowercase; Mintlify content has e.g. ```Python
      if (node.lang) node.lang = node.lang.toLowerCase();
      const meta = node.meta?.trim();
      if (!meta || meta.includes("=")) return;
      node.meta = `title="${meta.replace(/"/g, "'")}"`;
    });
  };
}
