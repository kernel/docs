// Braintrust logging for the AI chat. Only initializes when the API key is
// set, so local dev and preview builds run without it. Project defaults to
// docs-prod (override with BRAINTRUST_PROJECT).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.BRAINTRUST_API_KEY) {
    const { initLogger } = await import("braintrust");
    initLogger({
      projectName: process.env.BRAINTRUST_PROJECT ?? "docs-prod",
      apiKey: process.env.BRAINTRUST_API_KEY,
    });
  }
}
