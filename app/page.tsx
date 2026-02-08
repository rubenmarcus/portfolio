"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Github, Linkedin, Twitter, Mail, Send } from "lucide-react"

const TITLE = "prompt engineer · ai fullstack engineer · web3 engineer · frontend engineer · vibecoder"
const DESC = "building the future of AI and crypto. one prompt at a time."
const CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyz0123456789"

function useScramble(text: string) {
  const [display, setDisplay] = useState(text)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    let iteration = 0
    intervalRef.current = setInterval(() => {
      const keepCount = Math.floor(iteration / 2)
      let newText = ""
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || text[i] === "·" || text[i] === "." || text[i] === "&" || text[i] === "'" || text[i] === "\n") {
          newText += text[i]
        } else if (i < keepCount) {
          newText += text[i]
        } else {
          newText += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(newText)
      iteration++
      if (iteration >= text.length * 2) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setDisplay(text)
      }
    }, 30)
  }, [text])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setDisplay(text)
  }, [text])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return { display, start, stop }
}

export default function Home() {
  const title = useScramble(TITLE)
  const desc = useScramble(DESC)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [zoom, setZoom] = useState(1.1)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 1.2
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMouse({ x, y })
    }
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(prev => Math.min(Math.max(prev + e.deltaY * 0.001, 1.1), 1.5))
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("wheel", handleWheel)
    }
  }, [])

  return (
    <div
      className="relative h-screen overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10 scale-110"
        style={{
          transform: `scale(${isHovering ? zoom + 0.05 : zoom}) translate(${mouse.x * 10}px, ${mouse.y * 10}px)`,
          transition: "transform 0.8s ease-out",
        }}
      >
        <source src="/videobg.webm" type="video/webm" />
      </video>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-8 md:px-16 pt-8">
        <a
          href="https://multivmlabs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300"
        >
          currently @ multivmlabs
        </a>
        <a
          href="https://ralphstarter.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300"
        >
          working @ ralph-starter
        </a>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-8 md:px-16 pb-12">
        <h1
          className="font-mono text-base md:text-2xl font-normal text-green-400 tracking-tight text-left cursor-default transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 w-[30%]"
          onMouseEnter={title.start}
          onMouseLeave={title.stop}
        >
          {title.display}
        </h1>
        <p
          className="font-mono text-lg md:text-xl text-green-300/80 max-w-md text-right cursor-default transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-pre-line"
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
      </div>
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-5">
        <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Github size={22} />
        </a>
        <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Twitter size={22} />
        </a>
        <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Linkedin size={22} />
        </a>
        <a href="mailto:ruben@rubenmarcus.dev" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Mail size={22} />
        </a>
        <a href="https://t.me/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Send size={22} />
        </a>
      </div>
    </div>
  )
}
