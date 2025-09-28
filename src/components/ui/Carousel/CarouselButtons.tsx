"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ButtonProps {
  onClick: () => void;
  enabled: boolean;
}

export function PrevButton({ onClick, enabled }: ButtonProps) {
  return (
      <button
          type="button"
          aria-label="Previous slide"
          onClick={onClick}
          hidden={!enabled}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 shadow-md p-2 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
  );
}

export function NextButton({ onClick, enabled }: ButtonProps) {
  return (
      <button
          type="button"
          aria-label="Next slide"
          onClick={onClick}
          hidden={!enabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 shadow-md p-2 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
  );
}