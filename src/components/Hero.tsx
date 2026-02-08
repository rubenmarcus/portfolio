import { useState, useEffect, useRef, useCallback } from "react"
import { Github, Linkedin, Twitter, Mail, Send, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { TextLoop } from "./TextLoop"
import { InfiniteSlider } from "./InfiniteSlider"

const YT_TRACKS = [
  { id: "zWeYcNfYn3U", start: 180, title: "Prince Of Denmark - GS [FORUM V]" },
  { id: "nA-ZaQn55Eg", start: 785, title: "最初のプログラム" },
  { id: "DrmpZtxr0kY", start: 600, title: "Nostalgic Soundscapes - Forgotten" },
  { id: "vXLyxy3GTaY", start: 0, title: "MICROMECHA - Underwater Quest" },
  { id: "nII4LjJECRA", start: 0, title: "silver protocol - frutiger aero" },
  { id: "wuzD3m1Spj8", start: 811, title: "ESPRIT 空想 - LIVE" },
  { id: "KMQA9cuEKNc", start: 0, title: "4utechre twitch stream" },
  { id: "n9pjQfh0Zvg", start: 55, title: "DeepChord - Departure" },
  { id: "26j6tUQsxXg", start: 14, title: "Strut (Storm Mix)" },
  { id: "xp8HbdSLDgo", start: 132, title: "Aphex Twin - Zahl am1 live track 1c f760m1 unfinshd" },
]

const PROFESSIONS = [
  "prompt engineer",
  "AI fullstack engineer",
  "web3 engineer",
  "frontend engineer",
  "vibecoder",
]
const DESC = "building the future of AI and crypto. one prompt at a time."
const CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyz0123456789"

function useScramble(text: string, { autoStart = false }: { autoStart?: boolean } = {}) {
  const [display, setDisplay] = useState(autoStart ? ".".repeat(text.length) : text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  useEffect(() => {
    if (autoStart) start()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return { display, start, stop }
}

export default function Hero() {
  const desc = useScramble(DESC, { autoStart: true })
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [zoom, setZoom] = useState(1.1)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 1.2
  }, [])

  // YouTube IFrame Player API
  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      const track = YT_TRACKS[trackIndex]
      playerRef.current = new (window as any).YT.Player("yt-player", {
        videoId: track.id,
        playerVars: { autoplay: 1, start: track.start, loop: 1, playlist: track.id },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(100)
            e.target.unMute()
            e.target.playVideo()
            setMusicPlaying(true)
          },
        },
      })
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [])

  const loadTrack = useCallback((index: number) => {
    setTrackIndex(index)
    if (!playerRef.current?.loadVideoById) return
    const track = YT_TRACKS[index]
    playerRef.current.loadVideoById({ videoId: track.id, startSeconds: track.start })
    playerRef.current.unMute()
    playerRef.current.setVolume(100)
    setMusicPlaying(true)
  }, [])

  const nextTrack = useCallback(() => {
    loadTrack((trackIndex + 1) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const prevTrack = useCallback(() => {
    loadTrack((trackIndex - 1 + YT_TRACKS.length) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const toggleMusic = useCallback(() => {
    if (!playerRef.current) return
    if (musicPlaying) {
      playerRef.current.mute()
      setMusicPlaying(false)
    } else {
      playerRef.current.unMute()
      setMusicPlaying(true)
    }
  }, [musicPlaying])

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
      <div className="absolute inset-x-0 top-0 pt-6 md:pt-8">
        <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
          <span className="font-mono text-xs md:text-base text-green-400 whitespace-nowrap">
            Hi, I am Ruben Marcus, a brazilian dev based in Lisbon, Portugal.
          </span>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://multivmlabs.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            deving @ multivm labs
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://ralphstarter.ai" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            building ralph-starter
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://rubenluz.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            I do photography also
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          <a href={`https://www.youtube.com/watch?v=${YT_TRACKS[trackIndex].id}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-300/60 whitespace-nowrap transition-all duration-300 hover:text-green-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
            {musicPlaying ? `now playing: ${YT_TRACKS[trackIndex].title}` : "click to listen"}
          </a>
          <span className="text-green-500/40 font-mono">·</span>
        </InfiniteSlider>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col md:flex-row md:items-end md:justify-between px-4 md:px-16 pb-8 md:pb-12 gap-4 md:gap-0">
        <div className="font-mono text-sm md:text-2xl font-normal text-green-400 tracking-tight text-left cursor-default transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 md:w-[30%]">
          <TextLoop interval={2.5} transition={{ duration: 0.4 }}>
            {PROFESSIONS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </TextLoop>
        </div>
        <p
          className="font-mono text-base md:text-xl text-green-300/80 md:max-w-md text-left md:text-right cursor-default transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-pre-line"
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
      </div>
      <div className="absolute w-0 h-0 overflow-hidden">
        <div id="yt-player" ref={playerContainerRef} />
      </div>
      <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-5">
        <button
          onClick={prevTrack}
          className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125"
          aria-label="Previous track"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={toggleMusic}
          className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125"
          aria-label={musicPlaying ? "Mute music" : "Play music"}
        >
          {musicPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
        <button
          onClick={nextTrack}
          className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125"
          aria-label="Next track"
        >
          <SkipForward size={18} />
        </button>
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
