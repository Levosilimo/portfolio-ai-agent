import { tool } from "ai";
import { z } from "zod";
import {loadConfigWithCachingImages} from "@/config/loader";

const load = async () => await loadConfigWithCachingImages();

export const getContacts = tool({
  description:
    "Returns professional contact information and social media profiles.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return {
      personal: {
        name: cfg.personal.name,
        email: cfg.personal.email,
        location: cfg.personal.location,
        handle: cfg.personal.handle,
      },
      socials: cfg.socials,
      contacts: cfg.contacts,
      message: "Professional contact info from PortfolioConfig",
    };
  },
});

export const getSkills = tool({
  description: "Returns all technical skills from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.skills;
  },
});

export const getProjects = tool({
  description: "Returns all projects from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.projects;
  },
});

export const getResume = tool({
  description: "Returns resume information from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.resume;
  },
});

export const getPresentation = tool({
  description: "Returns presentation/bio info from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return {
      name: cfg.personal.name,
      title: cfg.personal.title,
      bio: cfg.personal.bio,
    };
  },
});

export const getJobInterest = tool({
  description: "Returns jobInterest info and preferences from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.jobInterest;
  },
});

export const getExperience = tool({
  description: "Returns experience info from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.experience;
  },
});

export const getLanguages = tool({
  description: "Returns languages info from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.languages;
  },
});

export const getCertifications = tool({
  description: "Returns certifications info from PortfolioConfig.",
  inputSchema: z.object({}),
  execute: async () => {
    const cfg = await load();
    return cfg.certifications;
  },
});
