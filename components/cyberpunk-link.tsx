"use client"

import { useState, useEffect, type ReactNode, useRef, Children } from "react"
import Link from "next/link"
import type { LinkProps as NextLinkProps } from "next/link"

interface CyberpunkLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> {
  href: string
  children: ReactNode
  className?: string
  variant?: "link" | "button"
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

const characters = "!@#$%^&*()_+-=[]{}|;:,./<>?`~あいうえおかきくけこさしすせそたちつてとなにぬねの"

export default function CyberpunkLink({
  href,
  children,
  className = "",
  variant = "link",
  onMouseEnter: externalMouseEnter,
  onMouseLeave: externalMouseLeave,
  ...props
}: CyberpunkLinkProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [displayText, setDisplayText] = useState<ReactNode>(children)
  const textRef = useRef<HTMLSpanElement>(null)

  // Extract text content from children
  const extractTextContent = (children: ReactNode): string => {
    let textContent = '';

    Children.forEach(children, child => {
      if (typeof child === 'string' || typeof child === 'number') {
        textContent += child;
      }
    });

    return textContent;
  };

  // Get the text part of the children
  const textContent = extractTextContent(children);

  useEffect(() => {
    if (!isHovering || textContent.length === 0) {
      setDisplayText(children);
      return;
    }

    let frameCount = 0;
    const maxFrames = 20;

    const scrambleInterval = setInterval(() => {
      frameCount++;

      // Create a copy of the children array to modify
      const newChildren = Children.map(children, child => {
        // Only scramble string children
        if (typeof child === 'string') {
          return child
            .split("")
            .map(char => {
              if (char === " ") return " ";

              const scrambleProbability = 0.2 * (1 - frameCount/maxFrames);
              return Math.random() < scrambleProbability
                ? characters.charAt(Math.floor(Math.random() * characters.length))
                : char;
            })
            .join("");
        }
        // Return other elements unchanged
        return child;
      });

      setDisplayText(newChildren);

      if (frameCount >= maxFrames) {
        clearInterval(scrambleInterval);
        setDisplayText(children);
      }
    }, 120);

    return () => {
      clearInterval(scrambleInterval);
      setDisplayText(children);
    };
  }, [isHovering, children, textContent]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsHovering(true)
    externalMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsHovering(false)
    externalMouseLeave?.(e)
  }

  return (
    <Link
      href={href}
      className={`cyberpunk-button flex items-center ${variant === "button" ? "cyberpunk-button-shadow" : ""} ${isHovering ? 'text-white' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span
        ref={textRef}
        className="block whitespace-nowrap align-middle"
        style={{ minWidth: '100%' }}
      >
        {displayText}
      </span>
    </Link>
  )
}