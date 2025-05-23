"use client"

import { useEffect, useState, useRef } from "react"

interface TerminalTextProps {
  text: string
  className?: string
  typingSpeed?: number
  glitchIntensity?: number
  cursorBlink?: boolean
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,./<>?`~"

export default function TerminalText({
  text,
  className = "",
  typingSpeed = 50,
  glitchIntensity = 3,
  cursorBlink = true,
}: TerminalTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Function to generate a random character
  const getRandomChar = () => characters.charAt(Math.floor(Math.random() * characters.length))

  // useEffect(() => {
  //   let currentIndex = 0
  //   let glitchCounter = 0

  //   // Reset state when text changes
  //   setDisplayText("")
  //   setIsTypingComplete(false)

  //   if (intervalRef.current) {
  //     clearInterval(intervalRef.current)
  //   }

  //   intervalRef.current = setInterval(() => {
  //     if (currentIndex >= text.length) {
  //       clearInterval(intervalRef.current!)
  //       setIsTypingComplete(true)
  //       return
  //     }

  //     // Build the current text with potential glitches
  //     let newText = text.substring(0, currentIndex)

  //     // Add the current character (potentially glitched)
  //     if (glitchCounter < glitchIntensity) {
  //       newText += getRandomChar()
  //       glitchCounter++
  //     } else {
  //       newText += text[currentIndex]
  //       currentIndex++
  //       glitchCounter = 0
  //     }

  //     // Add random characters after the current position for a "working on it" effect
  //     if (currentIndex < text.length) {
  //       const glitchLength = Math.min(3, text.length - currentIndex)
  //       for (let i = 0; i < glitchLength; i++) {
  //         if (Math.random() > 0.7) {
  //           newText += getRandomChar()
  //         }
  //       }
  //     }

  //     setDisplayText(newText)
  //   }, typingSpeed)

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //     }
  //   }
  // }, [text, typingSpeed, glitchIntensity])

  // // Blinking cursor effect
  // useEffect(() => {
  //   if (!cursorBlink) return

  //   const cursorInterval = setInterval(() => {
  //     setShowCursor((prev) => !prev)
  //   }, 530)

  //   return () => clearInterval(cursorInterval)
  // }, [cursorBlink])

  return (
    <span className={className}>
      <span className="terminal-text">{text}</span>
      {/* {!isTypingComplete || cursorBlink ? (
        <span className={`terminal-cursor ${showCursor ? "opacity-100" : "opacity-0"}`}>█</span>
      ) : null} */}
    </span>
  )
}
