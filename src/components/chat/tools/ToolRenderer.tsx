"use client";

import { motion } from "framer-motion";
import { Contacts } from "./Contacts";
import CVCard from "./CVCard";
import { Presentation } from "./Presentation";
import AllProjects from "@/components/chat/tools/projects/Projects";
import Resume from "./Resume";
import Skills from "./Skills";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { Experience } from "@/components/chat/tools/Experience";
import { Languages } from "@/components/chat/tools/Languages";
import { Certifications } from "@/components/chat/tools/Certifications";
import React from "react";
import { RepliesMap } from "@/types/chat";

interface ToolRendererProps {
  tool: string;
  messageId: string;
  config: PortfolioConfig;
  presetReplies: RepliesMap;
  handlePresetReply?: (question: string, reply: string, tool?: string) => void;
}

const toolMap: Record<
  string,
  (
    config: PortfolioConfig,
    key: string,
    onContactClick: () => void,
  ) => React.ReactElement | null
> = {
  getProjects: (config, key) => <AllProjects key={key} config={config} />,
  getPresentation: (config, key) => <Presentation key={key} config={config} />,
  getResume: (config, key, onContactClick: () => void) => (
    <Resume key={key} config={config} onContactClick={onContactClick} />
  ),
  getContacts: (config, key) => <Contacts key={key} config={config} />,
  getSkills: (config, key) => <Skills key={key} config={config} />,
  getJobInterest: (config, key, onContactClick: () => void) => (
    <CVCard key={key} config={config} onContactClick={onContactClick} />
  ),
  getExperience: (config, key) => <Experience key={key} config={config} />,
  getLanguages: (config, key) => <Languages key={key} config={config} />,
  getCertifications: (config, key) => (
    <Certifications key={key} config={config} />
  ),
};

export default function ToolRenderer({
  tool,
  config,
  messageId,
  presetReplies,
  handlePresetReply,
}: ToolRendererProps) {
  const Renderer = toolMap[tool];

  const contactPreset = Object.entries(presetReplies).find(([_, {tool}]) => tool === "getContacts");
  const onContactClick = () => {
    if (contactPreset && handlePresetReply) {
      handlePresetReply(
        contactPreset[0],
        contactPreset[1].reply,
        contactPreset[1].tool,
      );
    }
  }
  
  if (Renderer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg overflow-hidden"
      >
        {Renderer(config, messageId, onContactClick)}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-secondary/10 w-full rounded-lg p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-medium">{tool}</h3>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
          Tool Result
        </span>
      </div>
      <p>No component available for this tool.</p>
    </motion.div>
  );
}
