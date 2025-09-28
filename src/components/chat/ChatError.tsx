"use client";

import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/ChatBubble";

export default function ChatError({
  message,
  clearError,
}: {
  message: string;
  clearError: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <ChatBubble variant="received">
        <ChatBubbleMessage className="bg-amber-50 border border-amber-200">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-white text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 text-sm">Error</h3>
                <p className="text-xs text-amber-600">{message}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600"
            >
              Dismiss
            </button>
          </div>
        </ChatBubbleMessage>
      </ChatBubble>
    </div>
  );
}
