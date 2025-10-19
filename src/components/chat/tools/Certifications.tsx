"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/utils/motion";
import { PortfolioConfig } from "@/types/portfolio-schema";

export default function Certifications({
  config,
}: {
  config: PortfolioConfig;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 font-sans">
      <h2 className="text-2xl font-bold mb-6">Certifications</h2>
      <div className="space-y-6">
        {config.certifications.map((cert) => (
          <motion.div
            key={cert.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="rounded-xl border p-4 bg-card"
          >
            <h3 className="font-semibold text-lg">{cert.name}</h3>
            <p className="text-sm text-muted-foreground">
              {cert.issuer} · {new Date(cert.date).toLocaleDateString()}
            </p>
            {cert.credentialId && (
              <p className="text-xs text-muted-foreground">
                Credential ID: {cert.credentialId}
              </p>
            )}
            {cert.url && (
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Verify
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
