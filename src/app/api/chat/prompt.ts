import { getParser } from "@/config/loader";

export const SYSTEM_PROMPT = {
  role: "system" as const,
  content: getParser().systemPrompt(),
};
