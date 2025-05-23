"use client"

import { ExternalLink, Github } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import TerminalText from "./terminal-text"

interface ProjectCardProps {
  project: {
    title: string
    description: string
    tags: string[]
    link: string
    github?: string
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div
      className="border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors p-6 flex flex-col h-full "
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <h3 className="font-mono text-xl font-bold mb-2 text-green-400">
        {isHovering ? <TerminalText text={project.title} typingSpeed={20} glitchIntensity={3} /> : project.title}
      </h3>
      <p className="text-green-300/80 mb-4 font-mono text-sm flex-grow hover:text-white transition-colors duration-200">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.map((tag) => (
          <span key={tag} className="text-xs font-mono px-2 py-1 border border-green-500/30 text-green-400/80 hover:text-white transition-colors duration-200">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center space-x-4 mt-auto">
        <Link
          href={project.link}
          className="cyberpunk-button text-green-400 hover:text-green-300 transition-colors font-mono text-sm flex items-center px-2 py-1"
        >
          <ExternalLink className="mr-1 h-4 w-4" />
          View Project
        </Link>

        {project.github && (
          <Link
            href={project.github}
            className="cyberpunk-button text-green-400 hover:text-green-300 transition-colors font-mono text-sm flex items-center px-2 py-1"
          >
            <Github className="mr-1 h-4 w-4" />
            Source
          </Link>
        )}
      </div>
    </div>
  )
}
