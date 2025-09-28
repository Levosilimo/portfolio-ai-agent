"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { DefaultChatTransport, DynamicToolUIPart, generateId } from "ai";

import type { RepliesMap } from "@/types/chat";
import type { PortfolioConfig } from "@/types/portfolio-schema";

export function useChatState(
  config: PortfolioConfig,
  presetAnswers: RepliesMap,
) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") ?? "";

  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isUsingPregenerated, setIsUsingPregenerated] = useState(true);

  const { messages, sendMessage, stop, status, clearError, setMessages } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        headers: { "x-app-id": config.meta.appId ?? "" },
      }),
      onFinish: () => setLoadingSubmit(false),
      onError: (err) => {
        setLoadingSubmit(false);
        const message =
          err?.message?.includes("quota") || err?.message?.includes("429")
            ? "⚠️ API Quota Exhausted"
            : `Error: ${err?.message ?? "Unknown error"}`;
        toast.error(message);
        setErrorMessage(message);
      },
    });

  const {
    isLastMessageByUser = false,
    currentAIMessage,
    latestUserMessage,
    hasActiveTool,
  } = useMemo(() => {
    const latestAI = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const latestUser = [...messages].reverse().find((m) => m.role === "user");
    const hasActiveTool =
      latestAI?.parts?.some(
        (p) => p.type === "tool-invocation" && p.toolCallId !== "result",
      ) ?? false;

    return {
      currentAIMessage:
        latestAI &&
        (!latestUser ||
          messages.indexOf(latestAI) > messages.indexOf(latestUser))
          ? latestAI
          : null,
      latestUserMessage: latestUser,
      hasActiveTool: hasActiveTool,
      isLastMessageByUser:
        latestUser &&
        (!latestAI ||
          messages.indexOf(latestUser) > messages.indexOf(latestAI)),
    };
  }, [messages]);

  const isToolInProgress =
    hasActiveTool || status === "streaming" || status === "submitted";

  const submitQuery = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || isToolInProgress) return;

      setErrorMessage(null);

      const preset = presetAnswers?.[trimmed];
      if (preset) {
        setIsUsingPregenerated(true);
        const toolPart: DynamicToolUIPart | undefined = preset.tool
          ? {
              type: "dynamic-tool",
              toolName: preset.tool,
              toolCallId: generateId(),
              state: "output-available",
              input: {},
              output: {}, // optional, can pass result object
            }
          : undefined;

        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user",
            parts: [{ type: "text", text: trimmed }],
          },
          {
            id: generateId(),
            role: "assistant",
            parts: [
              { type: "text", text: preset.reply },
              ...(toolPart ? [toolPart] : []),
            ],
          },
        ]);
        return;
      }
      setIsUsingPregenerated(false);
      setLoadingSubmit(true);
      sendMessage({ parts: [{ type: "text", text: trimmed }] });
    },
    [presetAnswers, isToolInProgress, sendMessage, setMessages],
  );

  const handlePresetReply = useCallback(
    (question: string, reply: string, tool?: string) => {
      setIsUsingPregenerated(true);

      const toolPart: DynamicToolUIPart | undefined = tool
        ? {
            type: "dynamic-tool",
            toolName: tool,
            toolCallId: generateId(),
            state: "output-available",
            input: {},
            output: {}, // optional, can pass result object
          }
        : undefined;

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "user",
          parts: [{ type: "text", text: question }],
        },
        {
          id: generateId(),
          role: "assistant",
          parts: [
            { type: "text", text: reply },
            ...(toolPart ? [toolPart] : []),
          ],
        },
      ]);
      setErrorMessage(null);
      setLoadingSubmit(false);
    },
    [setMessages],
  );

  const handleQueryAIResponse = useCallback(
    (q: string) => {
      setErrorMessage(null);
      submitQuery(q);
    },
    [submitQuery],
  );

  useEffect(() => {
    if (initialQuery) submitQuery(initialQuery);
  }, [initialQuery, submitQuery]);

  return {
    input,
    setInput,
    errorMessage,
    clearError,
    loadingSubmit,
    submitQuery,
    handlePresetReply,
    handleQueryAIResponse,
    isUsingPregenerated,
    onSubmit: (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      submitQuery(input);
      setInput("");
    },
    handleStop: () => {
      stop();
      setLoadingSubmit(false);
    },
    messages,
    isLastMessageByUser,
    hasActiveTool,
    isToolInProgress,
    isEmptyState: !currentAIMessage && !latestUserMessage && !errorMessage,
  };
}
