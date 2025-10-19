"use client";

import { motion } from "framer-motion";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { fadeInUp } from "@/utils/motion";

export function Skills({ config }: { config: PortfolioConfig }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="mx-auto max-w-5xl rounded-2xl border p-6 shadow-sm bg-card"
    >
      <h2 className="text-xl font-semibold mb-4">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.skills.map((skill) => (
          <div key={skill.name}>
            <h3 className="font-medium">{skill.name}</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {skill.items.map((item) => (
                <li key={item}>
                  {item}
                  {skill.endorsementCount && (
                    <span className="ml-2 text-xs text-green-600">
                      {skill.endorsementCount} endorsements
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default Skills;
