import type { PortfolioConfig } from "@/types/portfolio-schema";
import { RepliesMap } from "@/types/chat";

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default class PortfolioParser {
  constructor(private cfg: PortfolioConfig) {}

  systemPrompt() {
    const tone = this.cfg.personality?.tone ?? "friendly";
    const { name, title, bio } = this.cfg.personal;

    const featuredProjects =
      this.cfg.projects
        .filter((p) => p.featured)
        .slice(0, 3)
        .map((p) => `- ${p.title} (${p.role}): ${p.summary}`)
        .join("\n") || "- none";

    const experienceHighlights = this.cfg.experience
      .slice(0, 2)
      .map(
        (exp) =>
          `- ${exp.position} at ${exp.company} (${exp.start ?? "?"} – ${
            exp.end ?? "present"
          })`,
      )
      .join("\n");

    const skills = this.cfg.skills
      .map((s) => `${s.name}: ${s.items.join(", ")}`)
      .slice(0, 3)
      .join("\n");

    const contact =
      this.cfg.socials?.linkedin ?? this.cfg.personal?.email ?? "not provided";

    return [
      `You are ${name}, a ${title}.`,
      `Tone: ${tone}`,
      `Bio: ${bio}`,
      ``,
      `### Professional Snapshot`,
      `Top skills:\n${skills || "- none"}`,
      `Recent experience:\n${experienceHighlights || "- none"}`,
      `Featured projects:\n${featuredProjects}`,
      ``,
      `### Communication Rules`,
      `- Always speak as ${name} in first person ("I", "my").`,
      `- Be confident but humble, professional but approachable.`,
      `- When asked about skills, projects, resume, or contact info — use tools instead of making things up.`,
      `- Do not hallucinate data outside PortfolioConfig.`,
      `- If asked something outside portfolio scope, politely say so and redirect back to strengths.`,
      `- Keep answers employability-focused: emphasize impact, achievements, and problem-solving.`,
      ``,
      `Contact: ${contact}`,
    ].join("\n");
  }

  presetReplies(): RepliesMap {
    const {
      personal,
      skills,
      projects,
      resume,
      jobInterest,
      certifications,
      languages,
    } = this.cfg;

    const answers: RepliesMap = {};

    answers["Who are you?"] = {
      reply: `I'm ${personal.name}, ${personal.title}. ${personal.bio}`,
      tool: "getPresentation",
    };

    if (skills.length > 0) {
      answers["What are your skills?"] = {
        reply: `I have strong expertise across different areas. Let me show you a structured overview of my skills.`,
        tool: "getSkills",
      };
    }

    if (projects.length > 0) {
      const featured = projects.filter((p) => p.featured);
      answers["What projects are you most proud of?"] = {
        reply:
          featured.length > 0
            ? `Here are a few of my featured projects: ${featured
                .map((p) => p.title)
                .join(", ")}.`
            : `I’ve worked on a number of impactful projects. Here’s an overview:`,
        tool: "getProjects",
      };
    }

    if (resume?.url) {
      answers["Can I see your resume?"] = {
        reply: `Of course, here's my resume: \n ${NEXT_PUBLIC_SITE_URL}${resume.url}`,
        tool: "getResume",
      };
    }

    if (personal.email || this.cfg.socials || this.cfg.contacts.length > 0) {
      answers["How can I reach you?"] = {
        reply: `Here’s how you can reach me through email or social profiles:`,
        tool: "getContacts",
      };
    }

    if (jobInterest?.seeking) {
      answers["Are you open to opportunities?"] = {
        reply: `Yes, I’m currently open to discussing ${jobInterest.type ?? "new"} opportunities. Let me show you my availability and focus areas.`,
        tool: "getJobInterest",
      };

      answers["What kind of role are you looking for?"] = {
        reply: `I’m most interested in roles focused on ${jobInterest.focusAreas.join(", ") || "software development"}${
          jobInterest.remoteOnly ? " (remote preferred)" : ""
        }.`,
        tool: "getJobInterest",
      };
    }

    if (certifications.length > 0) {
      answers["Do you have any certifications?"] = {
        reply: `Yes, I have earned certifications like ${certifications[0].name}.`,
        tool: "getCertifications",
      };
    }

    if (languages.length > 0) {
      answers["What languages do you speak?"] = {
        reply: `I speak ${languages.map((l) => l.name).join(", ")}.`,
        tool: "getLanguages",
      };
    }

    if (this.cfg.experience.length > 0) {
      answers["What professional experience do you have?"] = {
        reply: `I’ve gained hands-on experience across multiple roles. Let me show you a structured overview.`,
        tool: "getExperience",
      };
    }

    return answers;
  }
}
