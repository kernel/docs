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

This is a Mintlify documentation site (no `package.json`). The only service is the docs preview server.

- **Run the docs site:** `mintlify dev` (serves on `http://localhost:3000` by default; auto-increments if the port is busy)
- **Lint/build:** Mintlify handles rendering; there's no separate lint or build step. Validate by running `mintlify dev` and checking pages load.
- **Code snippets:** Generated via `.github/scripts/generate_code_samples.ts` (requires Bun). See `README.md` for details.
- **Config:** `docs.json` is the main Mintlify config (navigation, theme, OpenAPI spec URL, redirects).
