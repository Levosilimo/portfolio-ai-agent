import { Suspense } from "react";
import { getParser, loadConfigWithCachingImages } from "@/config/loader";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import ChatWrapper from "@/components/chat/ChatWrapper";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatLoader />
      </Suspense>
    </div>
  );
}

async function ChatLoader() {
  const config = await loadConfigWithCachingImages();
  const presetAnswers = getParser(config).presetReplies();
  return <ChatWrapper config={config} presetAnswers={presetAnswers} />;
}
