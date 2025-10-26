"use client";
import React, { useEffect, useState } from "react";
import { RepliesMap } from "@/types/chat";
import { PortfolioConfig } from "@/types/portfolio-schema";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import Chat from "@/components/chat/Chat";

interface ChatWrapperProps {
  config: PortfolioConfig;
  presetAnswers: RepliesMap;
}

export default function ChatWrapper({
  config,
  presetAnswers,
}: ChatWrapperProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <ChatSkeleton />;
  }

  return <Chat config={config} presetAnswers={presetAnswers} />;
}
