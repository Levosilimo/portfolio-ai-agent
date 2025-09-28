"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UIMessage } from "@ai-sdk/react";
import { ChatView } from "./ChatView";
import ChatLanding from "./ChatLanding";
import { MOTION_CONFIG } from "@/components/chat/Chat";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { RepliesMap } from "@/types/chat";

interface ChatBodyProps {
  isEmptyState: boolean;
  errorMessage: string | null;
  messages: UIMessage[];
  isLastMessageByUser: boolean;
  loadingSubmit: boolean;
  handleQueryAIResponse: (q: string) => void;
  config: PortfolioConfig;
  presetReplies: RepliesMap;
  topOffset?: number;
  handlePresetReply: (question: string, reply: string, tool?: string) => void;
}

export function ChatBody({
                           isEmptyState,
                           errorMessage,
                           messages,
                           isLastMessageByUser,
                           loadingSubmit,
                           handleQueryAIResponse,
                           config,
                           presetReplies,
                           topOffset,
                           handlePresetReply,
                         }: ChatBodyProps) {
  return (
      <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ paddingTop: topOffset }}>
        <AnimatePresence mode="wait">
          {isEmptyState && (
              <motion.div
                  key="landing"
                  className="flex min-h-full items-center justify-center"
                  {...MOTION_CONFIG}
              >
                <ChatLanding
                    submitQuery={handleQueryAIResponse}
                    handlePresetReply={handlePresetReply}
                    config={config}
                    presetReplies={presetReplies}
                />
              </motion.div>
          )}

          {errorMessage && (
              <motion.div key="error" {...MOTION_CONFIG} className="px-4 pt-4">
                <div className="text-red-500 text-sm">{errorMessage}</div>
              </motion.div>
          )}

          {messages.length > 0 && (
              <ChatView
                  messages={messages}
                  config={config}
                  loadingSubmit={loadingSubmit}
                  isLastMessageByUser={isLastMessageByUser}
                  handlePresetReply={handlePresetReply}
                  presetReplies={presetReplies}
              />
          )}
        </AnimatePresence>
      </div>
  );
}
