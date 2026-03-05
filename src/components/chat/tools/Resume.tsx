"use client";

import * as motion from "motion/react-client";
import { FileText, Download, Eye, Mail } from "lucide-react";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { fadeInUp } from "@/utils/motion";

interface ResumeCardProps {
  config: PortfolioConfig;
  onContactClick: () => void;
}

export default function Resume({ config, onContactClick }: ResumeCardProps) {
  const { resume } = config;
  if (!resume?.url) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="mx-auto max-w-5xl rounded-3xl border p-8 shadow-lg bg-card space-y-4"
    >
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Resume Viewer</h2>
      </div>

      <div className="flex flex-wrap gap-4">
        <a
          href={resume.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted-foreground/5 transition"
        >
          <Eye className="h-5 w-5" />
          Open in new tab
        </a>

        <a
          href={resume.url}
          download
          className="flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-muted-foreground/5 transition"
        >
          <Download className="h-5 w-5" />
          Download
        </a>

        <button
          onClick={onContactClick}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-secondary font-semibold hover:bg-primary/90 transition"
        >
          <Mail className="h-5 w-5" />
          Contact Me
        </button>
      </div>

      {/* In-page viewer */}
      <div className="mt-6 w-full h-[600px] border rounded-xl overflow-hidden">
        <iframe
          src={resume.url}
          className="w-full h-full"
          frameBorder="0"
          title="Resume Viewer"
        />
      </div>
    </motion.div>
  );
}
