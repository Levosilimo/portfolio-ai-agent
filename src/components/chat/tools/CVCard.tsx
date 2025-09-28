"use client";

import { motion } from "framer-motion";
import { Briefcase, Mail, Code, Book, Award } from "lucide-react";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { fadeInUp } from "@/utils/motion";
import {capitalize} from "@/utils";

interface CVCardProps {
  config: PortfolioConfig;
  onContactClick: () => void;
}

export default function CVCard({ config, onContactClick }: CVCardProps) {
  const { personal, jobInterest, skills, experience, projects, languages, certifications, privacy } = config;
  const age = personal.yearOfBirth && privacy.exposeAge ? new Date().getFullYear() - personal.yearOfBirth : undefined;

  return (
      <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mx-auto max-w-5xl rounded-3xl border p-8 shadow-lg bg-card space-y-6"
      >
        {/* Personal & Job Interest */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{personal.name}</h1>
            <p className="text-xl text-muted-foreground">{personal.title}</p>
            <div className="text-muted-foreground flex gap-2 mt-1">
              {age && <span>{age} y/o</span>}
              {personal.location && <span>{personal.location}</span>}
              {jobInterest?.remoteOnly && <span>Remote only</span>}
            </div>
          </div>
          {jobInterest?.seeking && (
              <button
                  onClick={onContactClick}
                  className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition"
              >
                <Mail className="h-5 w-5" />
                Contact Me
              </button>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                <Code className="h-5 w-5" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {skills.map(skill => (
                    <span key={skill.id} className="px-3 py-1 bg-muted-foreground/10 rounded-full text-sm">
                {skill.name}: {skill.items.join(", ")}
              </span>
                ))}
              </div>
            </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                <Briefcase className="h-5 w-5" />
                Experience
              </h2>
              <div className="space-y-4">
                {experience.map(exp => (
                    <div key={exp.id} className="border-l-2 border-primary pl-4">
                      <p className="font-semibold">{exp.position} @ {exp.company}</p>
                      <p className="text-sm text-muted-foreground">{exp.start?.slice(0, 10)} – {exp.end ? exp.end.slice(0,10) : "Present"}</p>
                      {exp.description && <p className="mt-1">{exp.description}</p>}
                      {exp.responsibilities.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                      )}
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Projects / Open Source */}
        {projects.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                <Book className="h-5 w-5" />
                Projects & Contributions
              </h2>
              <div className="space-y-3">
                {projects.map(proj => (
                    <div key={proj.id} className="border-l-2 border-secondary pl-4">
                      <p className="font-semibold">{proj.title} ({capitalize(proj.role)})</p>
                      <p className="text-sm text-muted-foreground">{proj.summary}</p>
                      {proj.tech.length > 0 && (
                          <p className="text-sm text-muted-foreground">Tech: {proj.tech.join(", ")}</p>
                      )}
                      {proj.links.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {proj.links.map(l => (
                                <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{l.name}</a>
                            ))}
                          </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Languages & Certifications */}
        {(languages.length > 0 || certifications.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {languages.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                      <Book className="h-5 w-5" />
                      Languages
                    </h2>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {languages.map(lang => (
                          <li key={lang.id}>{lang.name} – {lang.level}{lang.certified ? " (certified)" : ""}</li>
                      ))}
                    </ul>
                  </div>
              )}
              {certifications.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
                      <Award className="h-5 w-5" />
                      Certifications
                    </h2>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {certifications.map(cert => (
                          <li key={cert.id}>
                            {cert.name} ({cert.issuer}) – {cert.date.slice(0,10)}
                          </li>
                      ))}
                    </ul>
                  </div>
              )}
            </div>
        )}
      </motion.div>
  );
}
