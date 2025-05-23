"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import TerminalText from "./terminal-text"

interface Project {
  title: string
  description: string
  tags: string[]
  link: string
  github?: string
  image: string
}

interface ProjectGridProps {
  projects: Project[]
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const [filter, setFilter] = useState<string>("all")
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  // Extract unique tags from all projects
  const allTags = Array.from(new Set(projects.flatMap((project) => project.tags)))

  // Filter projects based on selected tag
  const filteredProjects = filter === "all" ? projects : projects.filter((project) => project.tags.includes(filter))

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-mono text-sm border cyberpunk-button ${
            filter === "all"
              ? "border-green-500 bg-green-500/20 text-green-400"
              : "border-green-500/30 hover:bg-green-500/10 text-green-400/80"
          } transition-colors`}
        >
          All
        </button>

        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-4 py-2 font-mono text-sm border cyberpunk-button ${
              filter === tag
                ? "border-green-500 bg-green-500/20 text-green-400"
                : "border-green-500/30 hover:bg-green-500/10 text-green-400/80"
            } transition-colors`}
          >
            {tag}
          </button>
        ))}
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
            onMouseEnter={() => setHoveredProject(project.title)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <div className="group relative overflow-hidden border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors h-full cyberpunk-aura">
              <div className="aspect-video overflow-hidden border-b border-green-500/20">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                />
              </div>
              <div className="p-6">
                <h3 className="font-mono text-xl font-bold mb-2 text-green-400">
                  {hoveredProject === project.title ? (
                    <TerminalText text={project.title} typingSpeed={20} glitchIntensity={3} />
                  ) : (
                    project.title
                  )}
                </h3>
                <p className="text-green-300/80 mb-4 font-mono text-sm">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs font-mono px-2 py-1 border border-green-500/30 text-green-400/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
