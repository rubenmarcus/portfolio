"use client"

import { Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import TerminalText from "./terminal-text"

interface BlogPostProps {
  post: {
    title: string
    excerpt: string
    date: string
    link: string
  }
}

export default function BlogPost({ post }: BlogPostProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Format date
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div
      className="border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors p-6 flex flex-col h-full cyberpunk-aura"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <h3 className="font-mono text-xl font-bold mb-2 text-green-400">
        {isHovering ? <TerminalText text={post.title} typingSpeed={20} glitchIntensity={3} /> : post.title}
      </h3>

      <div className="flex items-center text-green-400/60 mb-4 font-mono text-xs">
        <Calendar className="mr-1 h-3 w-3" />
        {formattedDate}
      </div>

      <p className="text-green-300/80 mb-4 font-mono text-sm flex-grow">{post.excerpt}</p>

      <Link
        href={post.link}
        className="cyberpunk-button text-green-400 hover:text-green-300 transition-colors font-mono text-sm mt-auto inline-block px-2 py-1"
      >
        Read More →
      </Link>
    </div>
  )
}
