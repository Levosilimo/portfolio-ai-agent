"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { fadeInUp } from "@/utils/motion";
import { PortfolioConfig } from "@/types/portfolio-schema";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Project = PortfolioConfig["projects"][number];

function ProjectCard({ project }: { project: Project }) {
  const firstImage = project.images[0];

  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        {firstImage && (
          <div className="relative w-full h-48">
            <Image
              src={firstImage.src}
              alt={firstImage.alt ?? project.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {project.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          {project.summary && (
            <p className="text-sm text-muted-foreground mb-3">
              {project.summary}
            </p>
          )}

          {project.tech.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {project.tech.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {project.links.length > 0 && (
            <a
              href={project.links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-sm text-blue-600 hover:underline"
            >
              {project.links[0].name || "View project →"}
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ProjectCard;
