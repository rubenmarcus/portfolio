"use client"

import { forwardRef } from "react"
import NextLink from "next/link"
import type { LinkProps as NextLinkProps } from "next/link"
import CyberpunkLink from "../cyberpunk-link"

export interface LinkProps extends NextLinkProps {
  children: React.ReactNode
  className?: string
  cyberpunk?: boolean
  target?: string
  rel?: string
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, className = "", cyberpunk = true, href, ...props }, ref) => {
    // Use CyberpunkLink for all links by default, unless cyberpunk is set to false
    if (cyberpunk) {
      return (
        <CyberpunkLink href={href.toString()} className={className} {...props}>
          {children}
        </CyberpunkLink>
      )
    }

    // Fall back to regular Next.js Link if cyberpunk is false
    return (
      <NextLink className={className} href={href} {...props} ref={ref}>
        {children}
      </NextLink>
    )
  }
)

Link.displayName = "Link"

export default Link