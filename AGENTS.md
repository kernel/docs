# Documentation agent instructions

## Style and formatting
- Use title case for the sidebar and H1, use sentence case for H2s and below
- Use active voice and second person ("you")
- Write for a technical, software developer audience
- Use contractions ("you're", "won't")
- Use bold formatting (**example**) when referencing UI elements and backticks for `inline code`. 
- Give the user clear recommendations and next steps when possible
- To indicate required or optional user actions or the outcomes of a process, select an appropriate verb—for example, "must", "can", or "might"; avoid "should"
- Give clear recommendations and explain the 'why', not just the 'what'; if unclear, ask for clarification
- Don't use the word "please"

## Code examples
- Ensure there's a TypeScript/Javascript version and a Python version
- Use real-world parameter values in examples, not placeholders

## Cursor Cloud specific instructions

This is a fumadocs (Next.js) documentation site. Content lives in `content/docs/` as MDX.

- **Run the docs site:** `bun dev` (serves on `http://localhost:3000`)
- **Lint/build:** `bun run build` compiles every page; `bun run lint` runs Biome. Validate changes with a build.
- **Config:** `docs.json` remains the navigation source of truth (tabs/groups/redirects); `lib/tree.ts` converts it to the sidebar at build time. Mintlify components (`<Info>`, `<CodeGroup>`, `<Steps>`, ...) still work — they're aliased in `components/mdx.tsx`.
