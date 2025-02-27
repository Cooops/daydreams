import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDreams } from "../../packages/core/src/core/v1/dreams";
import {
  action,
  expert,
  input,
  output,
  splitTextIntoChunks,
} from "../../packages/core/src/core/v1/utils";
import { Telegraf } from "telegraf";
import {
  createMemoryStore,
  defaultContext,
} from "../../packages/core/src/core/v1/memory";
import { createGroq } from "@ai-sdk/groq";
import { tavily, TavilyClient } from "@tavily/core";
import {
  InferContextFromHandler,
  InferMemoryFromHandler,
  LogLevel,
  WorkingMemory,
} from "../../packages/core/src/core/v1/types";
import createContainer from "@daydreamsai/core/src/core/v1/container";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const model = groq("deepseek-r1-distill-llama-70b");
const memory = createMemoryStore();

const container = createContainer()
  .instance("groq", groq)
  .instance("model", model)
  .instance("memory", memory)
  .singleton("tavily", () =>
    tavily({
      apiKey: process.env.TAVILY_API_KEY!,
    })
  )
  .singleton("telegraf", () => new Telegraf(process.env.TELEGRAM_TOKEN!));

createDreams<WorkingMemory>({
  logger: LogLevel.DEBUG,
  container,
  model,
  memory,
  experts: {},
  inputs: {
    "user:message": input({
      schema: z.object({ user: z.string(), text: z.string() }),
      handler: (message, { memory }) => {
        memory.inputs.push({
          ref: "input",
          type: "user:message",
          params: { user: message.user },
          data: message.text,
          timestamp: Date.now(),
        });

        return true;
      },
    }),

    "telegram:direct": input({
      schema: z.object({
        user: z.object({ id: z.number() }),
        text: z.string(),
      }),
      handler: (message, { memory }) => {
        memory.inputs.push({
          ref: "input",
          type: "telegram:direct",
          params: { userId: message.user.id.toString() },
          data: message.text,
          timestamp: Date.now(),
        });

        return true;
      },
      subscribe(send, agent) {
        agent.container.resolve<Telegraf>("telegraf").on("message", (ctx) => {
          const chat = ctx.chat;
          const user = ctx.msg.from;

          if ("text" in ctx.message) {
            send(`tg:${chat.id}`, {
              user: {
                id: user.id,
              },
              text: ctx.message.text,
            });
          }
        });

        return () => {};
      },
    }),
  },

  events: {
    "agent:thought": z.object({}),
    "agent:output": z.object({}),
  },

  outputs: {
    "telegram:direct": output({
      schema: z.object({
        userId: z
          .string()
          .describe("the userId to send the message to, you must include this"),
        content: z.string().describe("the content of the message to send"),
      }),
      description: "use this to send a telegram message to user",
      handler: async (data, ctx, agent) => {
        const chunks = splitTextIntoChunks(data.content, {
          maxChunkSize: 4096,
        });

        for (const chunck of chunks) {
          await agent.container
            .resolve<Telegraf>("telegraf")
            .telegram.sendMessage(data.userId, chunck);
        }
        return true;
      },
    }),

    // "telegram:group": output({
    //     params: z.object({
    //         groupId: z.string(),
    //         content: z.string(),
    //     }),
    //     description: "use this to send a telegram message to a group",
    //     handler: async (data, ctx) => {
    //         await telegraf.telegram.sendMessage(
    //             data.groupId,
    //             data.content
    //         );
    //         return true;
    //     },
    // }),
  },

  actions: [
    action({
      name: "getWeather",
      description: "",
      schema: z.object({
        location: z.string(),
      }),
      async handler(params, ctx) {
        return "Sunny";
      },
    }),

    action({
      name: "search",
      description: "Search online information using Tavily",
      schema: z.object({
        query: z.string().describe("The search query"),
        searchDepth: z
          .enum(["basic", "deep"])
          .optional()
          .describe(
            "The depth of search - basic is faster, deep is more thorough"
          ),
      }),
      async handler(call, ctx, agent) {
        const response = await agent.container
          .resolve<TavilyClient>("tavily")
          .search(call.data.query, {
            searchDepth: "advanced",
          });

        return {
          results: response.results.map((result) => ({
            title: result.title,
            url: result.url,
            content: result.content,
          })),
          totalResults: response.results.length,
        };
      },
    }),
  ],
});

const telegraf = container.resolve<Telegraf>("telegraf");
// input()
console.log("starting..");
telegraf.launch({ dropPendingUpdates: true });

const telegrafInfo = await telegraf.telegram.getMe();

console.log(telegrafInfo);
