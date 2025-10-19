import { Suspense } from "react";
import Chat from "@/components/chat/Chat";
import { getParser, loadConfigWithCachingImages } from "@/config/loader";

export default async function Home() {
  const config = await loadConfigWithCachingImages();
  const presetAnswers = getParser(config).presetReplies();
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading chat...</div>}>
        <Chat config={config} presetAnswers={presetAnswers} />
      </Suspense>
    </div>
  );
}
