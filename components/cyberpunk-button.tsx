"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"

interface CyberpunkButtonProps {
  href: string
  children: ReactNode
  className?: string
}

const characters = "!@#$%^&*()_+-=[]{}|;:,./<>?`~"

export default function CyberpunkButton({ href, children, className = "" }: CyberpunkButtonProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [displayText, setDisplayText] = useState<ReactNode>(children)

  // Convert children to string if possible
  const childrenText = typeof children === "string" ? children : ""

  useEffect(() => {
    if (!isHovering || !childrenText) {
      setDisplayText(children)
      return
    }

    let scrambleInterval: NodeJS.Timeout

    // Start scrambling effect
    scrambleInterval = setInterval(() => {
      const scrambledText = childrenText
        .split("")
        .map((char, idx) => {
          // Don't scramble spaces
          if (char === " ") return " "

          // Randomly decide whether to scramble this character
          return Math.random() > 0.7 ? characters.charAt(Math.floor(Math.random() * characters.length)) : char
        })
        .join("")

      setDisplayText(scrambledText)
    }, 100)

    return () => {
      clearInterval(scrambleInterval)
      setDisplayText(children)
    }
  }, [isHovering, children, childrenText])

  return (
    <Link
      href={href}
      className={`cyberpunk-button ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
    </Link>
  )
}
