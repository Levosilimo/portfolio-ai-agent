"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/utils/motion";
import { PortfolioConfig } from "@/types/portfolio-schema";

export default function Experience({ config }: { config: PortfolioConfig }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Experience</h2>
      <div className="space-y-6">
        {config.experience.map((exp) => (
          <motion.div
            key={exp.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="rounded-2xl bg-card shadow p-6"
          >
            <h3 className="font-semibold text-lg text-foreground">
              {exp.position}{" "}
              <span className="text-muted-foreground">at {exp.company}</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {exp.start} – {exp.end ?? "Present"}
            </p>
            {exp.description && (
              <p className="text-foreground mb-2">{exp.description}</p>
            )}
            {exp.achievements.length > 0 && (
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {exp.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
