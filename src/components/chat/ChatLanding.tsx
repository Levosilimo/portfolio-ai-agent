"use client";

import { motion, Variants } from "framer-motion";
import { RepliesMap } from "@/types/chat";
import { PortfolioConfig } from "@/types/portfolio-schema";
import React, { useMemo } from "react";
import {
  BowArrowIcon,
  CircleUserIcon, DramaIcon,
  FactoryIcon, FileUserIcon,
  HammerIcon,
  HandshakeIcon,
  LanguagesIcon,
  LucideIcon,
  MessageSquare,
  SignatureIcon,
} from "lucide-react";
import { ResumeIcon } from "@radix-ui/react-icons";
import { IconProps } from "@radix-ui/react-icons/dist/types";

interface ChatLandingProps {
  submitQuery: (query: string) => void;
  config: PortfolioConfig;
  presetReplies: RepliesMap;
  handlePresetReply?: (question: string, reply: string, tool?: string) => void;
}

const ICON_MAP: Record<
  string,
  | LucideIcon
  | React.ForwardRefExoticComponent<
      IconProps & React.RefAttributes<SVGSVGElement>
    >
> = {
  "Who are you?": MessageSquare,
  "What are your skills?": BowArrowIcon,
  "What projects are you most proud of?": HammerIcon,
  "Can I see your resume?": FileUserIcon,
  "How can I reach you?": CircleUserIcon,
  "Are you open to opportunities?": HandshakeIcon,
  "What kind of role are you looking for?": DramaIcon,
  "Do you have any certifications?": SignatureIcon,
  "What languages do you speak?": LanguagesIcon,
  "What professional experience do you have?": FactoryIcon,
};

export default function ChatLanding({
  submitQuery,
  config,
  presetReplies,
  handlePresetReply,
}: ChatLandingProps) {
  const questions = useMemo(() => {
    return Object.entries(presetReplies).map(([q], idx) => ({
      id: idx,
      text: q
    }));
  }, [presetReplies]);

  const handleQuestionClick = (q: string) => {
    const preset = presetReplies[q as keyof typeof presetReplies];
    if (preset && handlePresetReply) {
      handlePresetReply(q, preset.reply, preset.tool);
    } else {
      submitQuery(q);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      className="flex w-full flex-col items-center px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="mb-8 text-center" variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold">
          {`I'm ${config.personal.name.split(" ")[0]}'s digital twin`}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-md">
          {config.summary ??
            "Ask me about projects, experience, and opportunities."}
        </p>
      </motion.div>

      {config.jobInterest?.seeking && (
        <motion.div className="mb-8" variants={itemVariants}>
          <motion.button
            onClick={() =>
              handleQuestionClick("Are you open to opportunities?")
            }
            className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            {config.jobInterest.availability ?? "Available for opportunities"}
          </motion.button>
        </motion.div>
      )}

      <motion.div
        className="w-full max-w-md space-y-3"
        variants={containerVariants}
      >
        {questions.map((q) => {
          const Icon = ICON_MAP[q.text];
          return (
            <motion.button
              key={q.id}
              className="bg-accent hover:bg-accent/80 flex w-full items-center rounded-lg px-4 py-3 transition-colors"
              onClick={() => handleQuestionClick(q.text)}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="bg-background mr-3 rounded-full p-2">
                {Icon && <Icon className="h-5 w-5" />}
              </span>
              <span className="text-left">{q.text}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
