import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/Sonner";
import { loadConfigSync } from "@/config/loader";
import "./globals.css";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function generateMetadata(): Metadata {
  const config = loadConfigSync({ readCached: true });
  const { personal, socials, summary } = config;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";

  const title = `${personal.name} – ${personal.title}`;
  const description = summary ?? personal.bio;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${personal.name} Portfolio`,
    },
    description,
    keywords: [
      personal.name,
      personal.title,
      ...(personal.bio.split(" ") ?? []),
      "AI Agent Portfolio",
      "Developer AI Portfolio",
      "Customizable Portfolio Website",
      "Interactive AI Resume",
      "AI Chat Portfolio",
      "Next.js Portfolio Website",
      "React + AI Portfolio Website",
      "JSON Configurable Portfolio",
      "Professional AI Resume Site",
    ],
    authors: [{ name: personal.name, url: socials?.website }],
    creator: personal.name,
    publisher: personal.name,
    openGraph: {
      type: "website",
      url: siteUrl,
      title,
      description,
      siteName: `${personal.name} Portfolio`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: socials?.twitter,
      site: socials?.twitter,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    alternates: { canonical: siteUrl },
    category: "technology",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = loadConfigSync({ readCached: true });
  const { personal, socials } = config;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
  const ogImage = `${siteUrl}/api/og`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: personal.name,
    jobTitle: personal.title,
    description: personal.bio,
    url: siteUrl,
    image: ogImage,
    sameAs: Object.values(socials ?? {}).filter(Boolean),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
        >
          <main className="flex min-h-screen flex-col">{children}</main>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
