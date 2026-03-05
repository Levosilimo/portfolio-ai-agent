import { loadConfigSync } from "@/config/loader";

export async function GET() {
  const config = loadConfigSync({});

  const markdown = `
# Developer Profile: ${config.personal.name}
**Title:** ${config.personal.title}
**Location:** ${config.personal.location} (${config.personal.timezone})
**Availability:** ${config.jobInterest?.seeking ? `Seeking ${config.jobInterest.type} - ${config.jobInterest.availability}` : "Not currently seeking"}

## Executive Summary
${config.summary}

## Technical Stack & Expertise
${config.skills?.map((s) => `### ${s.name}\n${s.items.join(", ")}`).join("\n\n")}

## Professional Experience
${config.experience
  ?.map(
    (exp) => `
### ${exp.position} @ ${exp.company}
*${exp.start} - ${exp.end || "Present"} | ${exp.type}*
**Focus:** ${exp.responsibilities.join("; ")}
**Stack:** ${exp.technologies.join(", ")}
**Key Achievements:**
${exp.achievements.map((a) => `  - ${a}`).join("\n")}
`,
  )
  .join("\n")}

## Key Projects & Open Source
${config.projects
  ?.map(
    (p) => `
### ${p.title} (${p.status})
*Role: ${p.role}*
- **Summary:** ${p.summary}
- **Stack:** ${p.tech.join(", ")}
${p.metrics.length ? `- **Metrics:** ${p.metrics.join("; ")}` : ""}
- **Links:** ${p.links.map((l) => `[${l.name}](${l.url})`).join(", ")}
`,
  )
  .join("\n")}

## Education & Certifications
${config.education?.map((e) => `- **${e.degree}**, ${e.institution} (${e.start?.split("T")[0]})`).join("\n")}
${config.certifications?.map((c) => `- **${c.name}** issued by ${c.issuer} (${c.date})`).join("\n")}

## Contact & Socials
- **GitHub:** ${config.socials?.github}
- **LinkedIn:** ${config.socials?.linkedin}
- **Email:** ${config.personal.email}
- **Portfolio:** ${config.socials?.website}

---
## Metadata & Discovery
- **Last Updated:** ${config.meta.generatedAt}
- **Sitemap:** [View Sitemap](${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.md)
- **Format:** Prepared for LLM/Agent consumption via text/markdown.
  `.trim();

  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
