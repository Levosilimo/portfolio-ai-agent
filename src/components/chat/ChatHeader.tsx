"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { PortfolioConfig } from "@/types/portfolio-schema";

interface ChatHeaderProps {
  isOnline: boolean;
  config: PortfolioConfig;
  className?: string;
}

export function ChatHeader({ isOnline, config, className }: ChatHeaderProps) {
  return (
    <div
      className={`flex flex-col bg-white ${className}`}
    >
      <div
        className={`flex items-center justify-between px-4 pt-2 md:px-6 transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={config.personal.avatar?.src} alt="AI Avatar" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">
              {config.personal.name || "AI Assistant"}
            </span>
            <span className="text-xs text-muted-foreground max-w-xs">
              {config.personal.title}
            </span>
          </div>
        </div>

        <div
          className={`text-xs ${isOnline ? "text-green-500" : "text-cyan-800"}`}
        >
          <div className={"flex items-baseline"}>
            {isOnline ? "Online" : "Pregenerated"}
            <span className="relative mx-2 flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${isOnline ? "bg-green-500 animate-ping" : "bg-cyan-500"} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-cyan-500"}`}
              ></span>
            </span>
          </div>
        </div>
      </div>
      <div
        className={"h-2"}
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)`,
        }}
      ></div>
    </div>
  );
}
