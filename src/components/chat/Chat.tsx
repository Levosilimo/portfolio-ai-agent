"use client";

import { MotionProps } from "framer-motion";
import ChatForm from "@/components/chat/ChatForm";
import QuickQuestions from "./QuickQuestions";
import { ChatHeader } from "./ChatHeader";
import { ChatBody } from "./ChatBody";
import { useChatState } from "./useChatState";
import type { PortfolioConfig } from "@/types/portfolio-schema";
import { RepliesMap } from "@/types/chat";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import React from "react";

interface ChatProps {
  config: PortfolioConfig;
  presetAnswers: RepliesMap;
}

export const MOTION_CONFIG: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export default function Chat({ config, presetAnswers }: ChatProps) {
  const state = useChatState(config, presetAnswers);

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-shrink-0">
        <ChatHeader isOnline={!state.isUsingPregenerated} config={config} />
      </div>
      <ChatBody
        isEmptyState={state.isEmptyState}
        handlePresetReply={state.handlePresetReply}
        errorMessage={state.errorMessage}
        messages={state.messages}
        isLastMessageByUser={state.isLastMessageByUser}
        loadingSubmit={state.loadingSubmit}
        handleQueryAIResponse={state.handleQueryAIResponse}
        config={config}
        presetReplies={presetAnswers}
      />
      <div className="flex-shrink-0 bg-white px-2 pt-3 md:px-0">
        <div className="relative flex flex-col items-center gap-3 max-w-3xl mx-auto w-full">
          <QuickQuestions
            submitQuery={state.submitQuery}
            setInput={state.setInput}
            handlePresetReply={state.handlePresetReply}
            presetReplies={presetAnswers}
          />
          <ChatForm
            input={state.input}
            handleInputChange={(e) => state.setInput(e.target.value)}
            handleSubmit={state.onSubmit}
            isLoading={state.loadingSubmit}
            stop={state.handleStop}
            isToolInProgress={state.isToolInProgress}
          />
        </div>
        <div className="w-full flex">
          <Badge variant="secondary" className="text-xs mx-auto my-2">
            <Link href="https://github.com/Levosilimo/">
              Made with ♥ by Lev Sylin
            </Link>
          </Badge>
        </div>
      </div>
    </div>
  );
}
