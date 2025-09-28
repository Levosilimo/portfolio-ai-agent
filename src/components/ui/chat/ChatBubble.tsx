"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button, type ButtonProps } from "../Button";
import MessageLoading from "./MessageLoading";

// ---------------------------------------------
// ChatBubble (container)
// ---------------------------------------------
const bubbleVariants = cva("flex items-end gap-2 w-full", {
  variants: {
    variant: {
      received: "justify-start",
      sent: "justify-end",
    },
  },
  defaultVariants: {
    variant: "received",
  },
});

export interface ChatBubbleProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof bubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
    ({ variant, className, children, ...props }, ref) => {
      return (
          <div
              ref={ref}
              className={cn(bubbleVariants({ variant }), className)}
              {...props}
          >
            {children}
          </div>
      );
    }
);
ChatBubble.displayName = "ChatBubble";

export interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
}

const ChatBubbleAvatar = ({ src, fallback }: ChatBubbleAvatarProps) => (
    <Avatar className="h-8 w-8 mx-2">
      <AvatarImage src={src} alt="Avatar" />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

// ---------------------------------------------
// ChatBubbleMessage
// ---------------------------------------------
const messageVariants = cva(
    "relative px-4 py-2 max-w-[75%] text-sm whitespace-pre-wrap break-words",
    {
      variants: {
        variant: {
          received:
              "rounded-2xl rounded-bl-none bg-muted text-muted-foreground shadow-sm",
          sent: "rounded-2xl rounded-br-none bg-primary text-primary-foreground shadow-sm",
        },
      },
      defaultVariants: {
        variant: "received",
      },
    }
);

export interface ChatBubbleMessageProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof messageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
    HTMLDivElement,
    ChatBubbleMessageProps
>(({ variant, className, children, isLoading, ...props }, ref) => {
  return (
      <div
          ref={ref}
          className={cn(messageVariants({ variant }), className)}
          {...props}
      >
        {isLoading ? <MessageLoading /> : children}
      </div>
  );
});
ChatBubbleMessage.displayName = "ChatBubbleMessage";

// ---------------------------------------------
// ChatBubbleTimestamp
// ---------------------------------------------
export interface ChatBubbleTimestampProps
    extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
}

const ChatBubbleTimestamp = ({
                               timestamp,
                               className,
                               ...props
                             }: ChatBubbleTimestampProps) => (
    <span
        className={cn("mt-1 block text-xs text-muted-foreground opacity-70", className)}
        {...props}
    >
    {timestamp}
  </span>
);

// ---------------------------------------------
// ChatBubbleAction
// ---------------------------------------------
export type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode;
};

const ChatBubbleAction = ({
                            icon,
                            className,
                            variant = "ghost",
                            size = "icon",
                            ...props
                          }: ChatBubbleActionProps) => (
    <Button
        variant={variant}
        size={size}
        className={cn("rounded-full", className)}
        {...props}
    >
      {icon}
    </Button>
);

// Wrapper so actions can float next to bubbles
const ChatBubbleActionWrapper = ({
                                   children,
                                   className,
                                 }: {
  children: React.ReactNode;
  className?: string;
}) => (
    <div
        className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1",
            className
        )}
    >
      {children}
    </div>
);

// ---------------------------------------------
export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
};
