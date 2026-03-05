import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ChatSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between border-b border-border/50 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div className="flex flex-col gap-1 pt-2">
              <Skeleton width={120} height={14} />
              <Skeleton width={80} height={15} />
            </div>
          </div>
          <Skeleton width={80} height={16} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col space-y-5 items-center px-4">
          {/* Heading + summary */}
          <div className="mb-8 text-center flex flex-col items-center gap-3">
            <Skeleton width={200} height={38} borderRadius={6} />
            <Skeleton width={320} height={16} borderRadius={4} count={4} />
          </div>

          {/* Job interest button */}
          <div className="mb-8 flex justify-center">
            <Skeleton width={220} height={40} borderRadius={9999} />
          </div>

          {/* Question buttons list */}
          <div className="w-full max-w-md space-y-3">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="flex items-center w-full border-t border-border/50 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg px-4 py-3"
              >
                <Skeleton circle width={32} height={32} />
                <div className="ml-3 w-full">
                  <Skeleton width={`80%`} height={16} borderRadius={6} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={"flex-shrink-0 bg-background px-2 pt-3 md:px-0"}>
        {/* Chat form */}
        <div className="flex-shrink-0 px-2 md:px-0">
          {/* Quick questions */}
          <div className="flex-shrink-0 px-2 md:px-0 pb-4">
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 px-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton
                  key={i}
                  width={100 + i * 10}
                  height={32}
                  borderRadius={10}
                />
              ))}
            </div>
          </div>
          <div className="relative justify-end mx-auto flex w-full max-w-2xl items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-neutral-800 px-6 py-3 shadow-sm">
            <Skeleton width="100%" height={16} />
            <div className="ml-2 flex-shrink-0">
              <Skeleton circle width={40} height={40} />
            </div>
          </div>
        </div>
        {/* Badge */}
        <div className="flex justify-center py-1">
          <Skeleton width={130} height={24} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}
