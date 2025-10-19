import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import * as Tools from "./tools";
import { getParser, loadConfigSync } from "@/config/loader";
import { UIMessage } from "@ai-sdk/react";

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

function formatError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unserializable error";
  }
}

function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("Missing Google Generative AI API key", {
        status: 500,
      });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const cleanedMessages = clean(messages);

    const tools = {
      getContact: Tools.getContacts,
      getSkills: Tools.getSkills,
      getProjects: Tools.getProjects,
      getResume: Tools.getResume,
      getPresentation: Tools.getPresentation,
      getJobInterest: Tools.getJobInterest,
      getExperience: Tools.getExperience,
      getLanguages: Tools.getLanguages,
      getCertifications: Tools.getCertifications,
    };

    const config = loadConfigSync({ readCached: true });

    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: getParser(config).systemPrompt(),
      messages: convertToModelMessages(cleanedMessages),
      tools,
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const msg = formatError(err);
    if (msg.includes("quota") || msg.includes("429")) {
      return new Response("API quota exceeded. Please try again later.", {
        status: 429,
      });
    }
    if (msg.includes("network")) {
      return new Response("Network error. Please try again later.", {
        status: 503,
      });
    }
    return new Response(`Internal Server Error: ${msg}`, { status: 500 });
  }
}
