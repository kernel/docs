import { createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
} from "ai";
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

  const reqJson = await req.json();

  const result = streamText({
    model: anthropic(
      process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
    ),
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
