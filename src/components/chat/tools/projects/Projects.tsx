"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { fadeInUp } from "@/utils/motion";
import { capitalize } from "@/utils";

import Carousel from "@/components/ui/Carousel/Carousel";
import Image from "next/image";

export function Projects({ config }: { config: PortfolioConfig }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="mx-auto max-w-5xl rounded-2xl border p-6 shadow-sm bg-card"
    >
      <h2 className="text-xl font-semibold mb-6">Projects</h2>
      <div className="md:columns-2 gap-4 space-y-4">
        {config.projects.map((p) => (
          <motion.div
            key={p.id}
            variants={fadeInUp}
            className="rounded-lg border p-4 shadow-sm bg-background break-inside-avoid"
          >
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{p.summary}</p>

            {/* Carousel if images exist */}
            {p.images?.length > 0 && (
              <div className="mt-3">
                <Carousel className="w-full">
                  {p.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-full h-56 md:h-64 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt ?? `${p.title} image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </Carousel>
              </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              {p.role && <p>Role: {capitalize(p.role)}</p>}
              {p.status && <p>Status: {p.status}</p>}
              {p.achievements?.length > 0 && (
                <ul className="list-disc pl-4">
                  {p.achievements.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              )}
              {p.metrics?.length > 0 && (
                <ul className=" text-left text-gray-500 dark:text-gray-400">
                  {p.metrics.map((a, idx) => (
                    <li
                      className={
                        "flex items-center space-x-3 rtl:space-x-reverse"
                      }
                      key={idx}
                    >
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        viewBox="0 0 576 512"
                        xmlns="http://www.w3.org/2000/svg"
                        className={"shrink-0 w-2 h-2 mx-1 text-amber-500 dark:text-green-400"}
                      >
                        <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {p.links?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.links.map((l, idx) => (
                  <a
                    key={idx}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    {l.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default Projects;
