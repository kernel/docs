import { createHash } from "node:crypto";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkRateLimit } from "@vercel/firewall";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
} from "ai";
import { checkBotId } from "botid/server";
import { extractTraceContextFromHeaders, traced } from "braintrust";
import { Document, type DocumentData } from "flexsearch";
import { z } from "zod";
import { source } from "@/lib/source";
import type { ChatUIMessage, SearchTool } from "../../../components/ai/search";

interface CustomDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}
const searchServer = createSearchServer();

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: "url",
      index: ["title", "description", "content"],
      store: true,
    },
  });

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!("getText" in page.data)) return null;

      try {
        return {
          title: page.data.title,
          description: page.data.description,
          url: page.url,
          content: await page.data.getText("processed"),
        } as CustomDocument;
      } catch (err) {
        console.error(`[chat] failed to index ${page.url}:`, err);
        return null;
      }
    }),
  );

  for (const doc of docs) {
    if (doc) search.add(doc);
  }

  return search;
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHAT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

// cap request size before the model call so one caller can't push a huge
// context and run up token cost; a normal docs conversation is well under this
const MAX_INPUT_CHARS = 50_000;

// last user message text, for the Braintrust span input
function lastUserText(
  messages: ChatUIMessage[] | undefined,
): string | undefined {
  const parts = messages?.at(-1)?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  return text || undefined;
}

// Group every turn of one conversation into a single Braintrust trace. The
// chat is stateless (full history re-sent each turn), so we key on the first
// message's id — stable across a conversation, and reset when the user clears
// the chat (new first message → new trace). Encoded as a deterministic W3C
// traceparent so all turns share one root span.
function conversationParent(messages: ChatUIMessage[] | undefined) {
  const conversationId = messages?.[0]?.id;
  if (!conversationId) return undefined;
  const traceId = createHash("sha256")
    .update(conversationId)
    .digest("hex")
    .slice(0, 32);
  const spanId = createHash("sha256")
    .update(`${conversationId}:root`)
    .digest("hex")
    .slice(0, 16);
  return extractTraceContextFromHeaders({
    traceparent: `00-${traceId}-${spanId}-01`,
  });
}

/** System prompt, you can update it to provide more specific information */
const systemPrompt = [
  "You are an AI assistant for the Kernel documentation site (Kernel provides sandboxed cloud browsers for automations and web agents).",
  "Use the `search` tool to retrieve relevant docs context before answering when needed.",
  "The `search` tool returns raw JSON results from documentation. Use those results to ground your answer and cite sources as markdown links using the document `url` field when available.",
  "If you cannot find the answer in search results, say you do not know and suggest a better search query.",
].join("\n");

export async function POST(req: Request, _ctx: RouteContext<"/api/chat">) {
  // block cross-site callers from burning the API key; same-origin browser
  // requests always carry a matching Origin header
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return new Response("Forbidden", { status: 403 });
  }

  // invisible bot check (Vercel BotID); bypasses in development.
  // checkLevel must match the BotIdClient protect config in the root layout.
  const verification = await checkBotId({
    advancedOptions: { checkLevel: "deepAnalysis" },
  });
  if (verification.isBot) {
    return new Response("Forbidden", { status: 403 });
  }

  // per-client rate limit via the Vercel Firewall "chat" rule (limit + window
  // are configured in the dashboard); keys on the client IP by default
  const { rateLimited } = await checkRateLimit("chat", { request: req });
  if (rateLimited) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const reqJson = await req.json();

  // reject oversized payloads before the model call — bounds per-request cost
  if (JSON.stringify(reqJson.messages ?? []).length > MAX_INPUT_CHARS) {
    return new Response("Payload Too Large", { status: 413 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // one Braintrust trace per conversation (see conversationParent); each turn
  // is a span under it, and the AI SDK call is auto-instrumented as a child
  // (output, tokens, cost). No-ops when BRAINTRUST_API_KEY is unset.
  return traced(
    async (span) => {
      span.log({
        input: lastUserText(reqJson.messages),
        metadata: { ip, model: CHAT_MODEL },
      });

      const result = streamText({
        model: anthropic(CHAT_MODEL),
        // AI SDK v7: the system prompt goes here, not as a role:"system" message
        instructions: systemPrompt,
        maxOutputTokens: 2048,
        stopWhen: stepCountIs(5),
        tools: {
          search: searchTool,
        },
        messages: await convertToModelMessages<ChatUIMessage>(
          reqJson.messages ?? [],
          {
            convertDataPart(part) {
              if (part.type === "data-client")
                return {
                  type: "text",
                  text: `[Client Context: ${JSON.stringify(part.data)}]`,
                };
            },
          },
        ),
        toolChoice: "auto",
      });

      return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream }),
      });
    },
    {
      name: "docs-chat",
      type: "function",
      parent: conversationParent(reqJson.messages),
    },
  );
}

const searchTool = tool({
  description: "Search the docs content and return raw JSON results.",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer;
    return await search.searchAsync(query, {
      limit,
      merge: true,
      enrich: true,
    });
  },
}) satisfies SearchTool;
