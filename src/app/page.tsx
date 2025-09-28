import { Suspense } from "react";
import Chat from "@/components/chat/Chat";
import {getParser, loadConfigWithCachedImages} from "@/config/loader";

export default async function Home() {
  const config = await loadConfigWithCachedImages();
  const presetAnswers = getParser().presetReplies();
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading chat...</div>}>
        <Chat config={config} presetAnswers={presetAnswers} />
      </Suspense>
    </div>
  );
}
