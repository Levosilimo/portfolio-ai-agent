"use client";

import {useEffect, useRef, RefObject} from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { UIMessage } from "@ai-sdk/react";
import {
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/ChatBubble";
import ChatMessageContent from "./ChatMessageContext";
import ToolRenderer from "./tools/ToolRenderer";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { getToolOrDynamicToolName, isToolOrDynamicToolUIPart } from "ai";
import { RepliesMap } from "@/types/chat";

interface ChatViewProps {
  messages: UIMessage[];
  config: PortfolioConfig;
  loadingSubmit: boolean;
  isLastMessageByUser: boolean;
  presetReplies: RepliesMap;
  handlePresetReply?: (question: string, reply: string, tool?: string) => void;
  chatBodyRef?: RefObject<HTMLDivElement | null>;
}

const messageAnimation: Variants = {
  hidden: () => ({ opacity: 0, y: 10 }),
  visible: (variant: "sent" | "received") => ({
    opacity: 1,
    y: 0,
    transition:
      variant === "received"
        ? { duration: 1, ease: "easeOut" }
        : { duration: 0.5, ease: "easeIn" },
  }),
};

function scrollWithOffsetToScrollableContainer(el: HTMLElement, container: HTMLElement) {
  const top = el.offsetTop - container.offsetTop;
  container.scrollTo({
    top: top,
    behavior: "smooth",
  });

}

export function ChatView({
  messages,
  config,
  loadingSubmit,
  isLastMessageByUser,
  presetReplies,
  handlePresetReply,
  chatBodyRef,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageIndex = messages.findLastIndex(
    (message) => message.role === "user",
  );

  useEffect(() => {
    if (scrollRef.current && chatBodyRef?.current) {
      requestAnimationFrame(() => {
        scrollWithOffsetToScrollableContainer(scrollRef.current!, chatBodyRef.current!);
      });
    }
  }, [messages, loadingSubmit, chatBodyRef]);

  return (
    <div className="flex flex-col px-4">
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-4"
        style={{ overscrollBehavior: "contain" }}
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const variant: "sent" | "received" =
              message.role === "user" ? "sent" : "received";

            const toolParts = message.parts.filter(isToolOrDynamicToolUIPart);
            const hasTools = toolParts.length > 0;
            const hasText = message.parts.some(
              (p) => p.type === "text" && p.text.trim().length > 0,
            );

            const isScrollRef = index === lastUserMessageIndex;
            return (
              <motion.div
                key={message.id}
                custom={variant}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={messageAnimation}
                className={`flex w-full ${
                  variant === "sent" ? "justify-end" : "justify-start"
                }`}
                ref={isScrollRef ? scrollRef : undefined}
              >
                {variant === "received" && (
                  <ChatBubbleAvatar
                    src={
                      config.personal.avatar?.src ??
                      config.personal.avatar?.fallback
                    }
                    fallback="AI"
                  />
                )}

                <div className="flex flex-col gap-2">
                  {hasText && (
                    <ChatBubbleMessage
                      variant={variant}
                      className="max-w-xl w-auto"
                    >
                      <ChatMessageContent message={message} />
                    </ChatBubbleMessage>
                  )}

                  {hasTools &&
                    toolParts.map((tool) => (
                      <ToolRenderer
                        key={tool.toolCallId}
                        tool={getToolOrDynamicToolName(tool) ?? ""}
                        config={config}
                        messageId={message.id}
                        presetReplies={presetReplies}
                        handlePresetReply={handlePresetReply}
                      />
                    ))}
                </div>
              </motion.div>
            );
          })}

          {loadingSubmit && isLastMessageByUser && (
            <motion.div
              key="typing"
              custom="received"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={messageAnimation}
              className="flex w-full justify-start"
            >
              <div className="flex items-end gap-2 max-w-[90%]">
                <ChatBubbleAvatar
                  src={
                    config.personal.avatar?.src ??
                    config.personal.avatar?.fallback
                  }
                  fallback="AI"
                />
                <ChatBubbleMessage variant="received" isLoading />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div />
      </div>
    </div>
  );
}
