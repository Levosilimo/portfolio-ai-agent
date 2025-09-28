import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface ButtonWithTooltipProps {
  children: React.ReactElement;
  side: "top" | "bottom" | "left" | "right";
  toolTipText: string;
}

export default function ButtonWithTooltip({
  children,
  side,
  toolTipText,
}: ButtonWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>
          <div>{toolTipText}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
