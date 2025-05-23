"use client"

import type { ReactNode } from "react"
import CyberpunkLink from "./cyberpunk-link"

interface CyberpunkButtonProps {
  href: string
  children: ReactNode
  className?: string
}

export default function CyberpunkButton({ href, children, className = "" }: CyberpunkButtonProps) {
  return (
    <CyberpunkLink
      href={href}
      className={className}
      variant="button"
    >
      {children}
    </CyberpunkLink>
  )
}
