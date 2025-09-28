"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/utils/motion";
import { PortfolioConfig } from "@/types/portfolio-schema";

export function Languages({ config }: { config: PortfolioConfig }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Languages</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {config.languages.map((lang) => (
          <motion.div
            key={lang.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="rounded-xl border p-4 bg-card"
          >
            <h3 className="font-semibold text-lg">{lang.name}</h3>
            <p className="text-sm text-muted-foreground">{lang.level}</p>
            {lang.certified && lang.certificate && (
              <a
                href={lang.certificate}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                View certificate
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
