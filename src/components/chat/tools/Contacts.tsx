"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, AtSign, LinkIcon } from "lucide-react";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { fadeInUp } from "@/utils/motion";

export default function Contacts({ config }: { config: PortfolioConfig }) {
  const { personal, socials, contacts, privacy } = config;

  const socialLinks = Object.entries(socials ?? {}).filter(([, url]) => !!url);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm bg-card"
    >
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
      <div className="space-y-3 text-muted-foreground">
        {personal.email && privacy.exposeEmail && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${personal.email}`} className="hover:underline">
              {personal.email}
            </a>
          </div>
        )}
        {personal.handle && (
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4" />
            <span>@{personal.handle}</span>
          </div>
        )}
        {personal.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{personal.location}</span>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Social Profiles</h3>
            <ul className="grid grid-cols-2 gap-2">
              {socialLinks.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="capitalize">{name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {contacts?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Additional Contacts</h3>
            <ul className="space-y-1">
              {contacts.map((c, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <a href={c.url} className="hover:underline">
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
