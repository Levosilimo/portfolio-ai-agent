import { z } from "zod";

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid ISO date" })
  .describe("isoDate");

const Url = z.url();
const NonEmpty = z.string().min(1);

export const PortfolioConfigSchema = z
  .object({
    meta: z.object({
      version: NonEmpty,
      appId: z.string().optional(),
      generatedAt: isoDate,
      author: z.string().optional(),
      changelog: z.string().optional(),
    }),

    personal: z.object({
      id: NonEmpty,
      name: NonEmpty,
      title: NonEmpty,
      bio: NonEmpty,
      email: z.email(),
      handle: NonEmpty,
      location: z.string().optional(),
      yearOfBirth: z.number().int().optional(),
      pronouns: z.string().optional(),
      avatar: z
        .object({
          src: Url.optional(),
          fallback: Url.optional(),
        })
        .optional(),
      timezone: z.string().optional(),
    }),

    socials: z
      .object({
        linkedin: Url.optional(),
        github: Url.optional(),
        twitter: Url.optional(),
        website: Url.optional(),
      })
      .optional(),

    contacts: z.array(z.object({ name: NonEmpty, url: Url })).default([]),

    languages: z
      .array(
        z.object({
          id: NonEmpty,
          name: NonEmpty,
          level: NonEmpty,
          certified: z.boolean().optional(),
          certificate: Url.optional(),
        }),
      )
      .default([]),

    certifications: z
      .array(
        z.object({
          id: NonEmpty,
          name: NonEmpty,
          issuer: NonEmpty,
          date: isoDate,
          credentialId: z.string().optional(),
          url: Url.optional(),
          score: z.string().optional(),
          subscores: z.record(z.string(), z.number()).optional(),
        }),
      )
      .default([]),

    summary: z.string().optional(),

    education: z
      .array(
        z.object({
          id: NonEmpty,
          institution: NonEmpty,
          degree: z.string().optional(),
          field: z.string().optional(),
          start: isoDate.optional(),
          end: isoDate.optional(),
          grade: z.string().optional(),
          highlights: z.array(NonEmpty).default([]),
          isCurrent: z.boolean().default(false),
        }),
      )
      .default([]),

    experience: z
      .array(
        z.object({
          id: NonEmpty,
          company: NonEmpty,
          position: NonEmpty,
          type: z
            .enum([
              "full-time",
              "part-time",
              "contract",
              "freelance",
              "internship",
              "open-source",
            ])
            .default("full-time"),
          start: isoDate.optional(),
          end: isoDate.optional(),
          description: z.string().optional(),
          responsibilities: z.array(NonEmpty).default([]),
          technologies: z.array(NonEmpty).default([]),
          achievements: z.array(NonEmpty).default([]),
          location: z.string().optional(),
          remote: z.boolean().optional(),
        }),
      )
      .default([]),

    skills: z
      .array(
        z.object({
          id: NonEmpty,
          name: NonEmpty,
          items: z.array(NonEmpty).default([]),
          endorsementCount: z.number().int().nonnegative().optional(),
        }),
      )
      .default([]),

    projects: z
      .array(
        z.object({
          id: NonEmpty,
          title: NonEmpty,
          summary: NonEmpty,
          description: z.string().optional(),
          status: z
            .enum(["active", "archived", "prototype", "planned", "completed"])
            .default("completed"),
          featured: z.boolean().default(false),
          categories: z.array(NonEmpty).default([]),
          tech: z.array(NonEmpty).default([]),
          role: z.enum(["creator", "contributor", "lead"]).default("creator"),
          startDate: isoDate.optional(),
          endDate: isoDate.optional(),
          metrics: z.array(NonEmpty).default([]),
          achievements: z.array(NonEmpty).default([]),
          links: z.array(z.object({ name: NonEmpty, url: Url })).default([]),
          images: z
            .array(z.object({ src: Url, alt: z.string().optional() }))
            .default([]),
        }),
      )
      .default([]),

    jobInterest: z
      .object({
        seeking: z.boolean().default(false),
        type: z
          .enum(["internship", "part-time", "full-time", "contract"])
          .optional(),
        startWindow: z.string().optional(),
        preferredLocations: z.array(z.string()).default([]),
        focusAreas: z.array(NonEmpty).default([]),
        availability: z.string().optional(),
        remoteOnly: z.boolean().optional(),
      })
      .optional(),

    personality: z
      .object({
        tone: z
          .enum(["formal", "friendly", "playful", "concise", "detailed"])
          .default("friendly"),
        traits: z.array(NonEmpty).default([]),
        interests: z.array(NonEmpty).default([]),
        funFacts: z.array(NonEmpty).default([]),
      })
      .optional(),

    resume: z
      .object({
        url: Url.optional(),
        lastUpdated: isoDate.optional(),
        format: z.enum(["pdf", "docx", "html"]).optional(),
      })
      .optional(),

    tools: z
      .array(
        z.object({
          id: NonEmpty,
          name: NonEmpty,
          description: z.string().optional(),
          inputSchema: z.any().optional(),
        }),
      )
      .default([]),

    privacy: z.object({
      exposeEmail: z.boolean().default(false),
      exposeAge: z.boolean().default(true),
      publicProfile: z.boolean().default(true),
      shareMetrics: z.boolean().default(false),
    }),
  })
  .strict();

export type PortfolioConfig = z.infer<typeof PortfolioConfigSchema>;
