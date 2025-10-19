"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { fadeInUp, scaleIn } from "@/utils/motion";
import { PortfolioConfig } from "@/types/portfolio-schema";

export default function Presentation({ config }: { config: PortfolioConfig }) {
  const avatarUrl =
    config.personal.avatar?.src || config.personal.avatar?.fallback;
  const age =
    config.personal.yearOfBirth && config.privacy.exposeAge
      ? new Date().getFullYear() - config.personal.yearOfBirth
      : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl py-6 font-sans px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        {/* Text */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <h1 className="bg-clip-text text-xl md:text-3xl font-semibold text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            {config.personal.name}
          </h1>
          <p className="text-muted-foreground">{config.personal.title}</p>

          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 text-muted-foreground">
            {age && <p>{age} y/o</p>}
            {config.personal.location && (
              <>
                {age && (
                  <span className="hidden md:block bg-border h-1.5 w-1.5 rounded-full" />
                )}
                <p>{config.personal.location}</p>
              </>
            )}
          </div>

          {config.personal.bio && (
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mt-6 text-foreground leading-relaxed whitespace-pre-line"
            >
              {config.personal.bio}
            </motion.p>
          )}
        </motion.div>
        {/* Image */}
        {avatarUrl && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl overflow-hidden"
          >
            <Image
              src={avatarUrl}
              alt={`${config.personal.name} Avatar`}
              width={500}
              height={500}
              className="object-cover w-full h-full"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
