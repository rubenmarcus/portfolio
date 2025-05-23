"use client"

import { useState, useEffect } from "react"
import Link from "@/components/ui/link"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  const [logoText, setLogoText] = useState("rubenmarcus.dev")
  const [hasScrolled, setHasScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Glitch effect for the logo
  useEffect(() => {
    if (!isGlitching) return

    const chars = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const originalText = "rubenmarcus.dev"
    let iteration = 0
    let interval: NodeJS.Timeout

    const scramble = () => {
      // Calculate how many characters to keep unchanged (increases with iterations)
      const keepCount = Math.floor(iteration / 2)

      // Create the new text with some characters scrambled
      let newText = ""
      for (let i = 0; i < originalText.length; i++) {
        // Keep original characters based on iteration progress
        if (i < keepCount) {
          newText += originalText[i]
        } else {
          // Randomly decide whether to scramble this character
          if (Math.random() < 0.9) {
            newText += chars[Math.floor(Math.random() * chars.length)]
          } else {
            newText += originalText[i]
          }
        }
      }

      setLogoText(newText)
      iteration++

      // Stop when all characters are back to original
      if (iteration >= originalText.length * 2) {
        clearInterval(interval)
        setLogoText(originalText)
        setIsGlitching(false)
      }
    }

    // Run the scramble effect rapidly
    interval = setInterval(scramble, 50)

    return () => clearInterval(interval)
  }, [isGlitching])

  return (
    <header className={`sticky top-0 z-50 ${hasScrolled ? 'border-b border-green-500/20' : ''} bg-black/80 backdrop-blur-sm`}>
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-xl font-bold text-green-400 relative overflow-hidden group"
          onMouseEnter={() => setIsGlitching(true)}
          onMouseLeave={() => setIsGlitching(false)}
        >
          <span className="text-green-500 pr-1">&gt;</span>   {logoText}
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          {isGlitching && <span className="absolute inset-0 bg-green-500/10 animate-pulse"></span>}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8 font-mono">
            <li>
              <Link href="/" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/portfolio"
                className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden text-green-400 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-green-500/20">
          <div className="container px-4 py-4">
            <ul className="space-y-4 font-mono">
              <li>
                <Link href="/" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button block py-2">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button block py-2"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button block py-2">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-400 hover:text-green-300 transition-colors cyberpunk-button block py-2">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}
