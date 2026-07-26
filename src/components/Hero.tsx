import { useState, useEffect, useRef, useCallback } from "react"
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  Instagram,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Shuffle,
  type LucideIcon,
} from "lucide-react"
import { TextLoop } from "./TextLoop"
import { InfiniteSlider } from "./InfiniteSlider"
import { site } from "../config/site"

const YT_TRACKS = site.tracks
const PROFESSIONS = site.roles
const DESC = site.tagline.en
const CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyz0123456789"
const GH_USER = site.githubUser
const GLOW =
  "transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:text-[#A8E0E0]"

const VIDEO_ZOOM = {
  default: 1.08,
  min: 1.0,
  max: 1.22,
  centerBonus: 0.06,
  wheelStep: 0.0008,
  /** Extra canvas so parallax translate never exposes the page background */
  parallaxPx: 18,
  bleedPercent: 118,
} as const

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
}

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

type GitHubStats = {
  today: number; month: number; year: number; total: number
  lastCommit: { message: string; repo: string; url: string } | null
}

function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null)

  useEffect(() => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    Promise.all([
      fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`).then(r => r.json()),
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`).then(r => r.json()),
      fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}`).then(r => r.json()),
    ])
      .then(([contribData, events, allData]) => {
        const contributions: { date: string; count: number }[] = contribData.contributions || []
        let today = 0, month = 0, year = 0
        for (const c of contributions) {
          const d = new Date(c.date)
          if (c.date === todayStr) today = c.count
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) month += c.count
          if (d.getFullYear() === currentYear) year += c.count
        }
        const totalByYear: Record<string, number> = allData.total || {}
        const total = Object.values(totalByYear).reduce((sum: number, n) => sum + (n as number), 0)

        let lastCommit: GitHubStats["lastCommit"] = null
        if (Array.isArray(events)) {
          for (const event of events) {
            if (event.type === "PushEvent" && event.payload?.commits?.length) {
              const commit = event.payload.commits[event.payload.commits.length - 1]
              const repo = event.repo?.name?.replace(`${GH_USER}/`, "") || ""
              lastCommit = {
                message: commit.message.split("\n")[0],
                repo,
                url: `https://github.com/${event.repo?.name}/commit/${commit.sha}`,
              }
              break
            }
          }
        }

        setStats({ today, month, year, total, lastCommit })
      })
      .catch(() => {})
  }, [])

  return stats
}

export default function Hero() {
  const desc = useScramble(DESC, { autoStart: true })
  const ghStats = useGitHubStats()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [zoom, setZoom] = useState(VIDEO_ZOOM.default)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 1.05
    const tryPlay = () => {
      void video.play().catch(() => {})
    }
    tryPlay()
    video.addEventListener("loadeddata", tryPlay)
    video.addEventListener("canplay", tryPlay)
    return () => {
      video.removeEventListener("loadeddata", tryPlay)
      video.removeEventListener("canplay", tryPlay)
    }
  }, [])

  // YouTube IFrame Player API — start muted, unmute on first interaction
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
            e.target.mute()
            e.target.playVideo()
          },
        },
      })
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [])

  // Unmute on first user interaction (click/tap/keypress)
  useEffect(() => {
    const events = ["click", "touchstart", "keydown", "pointerdown"] as const
    const unmute = () => {
      if (playerRef.current?.unMute) {
        playerRef.current.unMute()
        playerRef.current.setVolume(100)
        setMusicPlaying(true)
      }
      events.forEach(e => window.removeEventListener(e, unmute))
    }
    events.forEach(e => window.addEventListener(e, unmute, { once: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, unmute))
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

  const randomTrack = useCallback(() => {
    let next: number
    do { next = Math.floor(Math.random() * YT_TRACKS.length) } while (next === trackIndex && YT_TRACKS.length > 1)
    loadTrack(next)
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
      setZoom((prev) =>
        Math.min(
          Math.max(prev + e.deltaY * VIDEO_ZOOM.wheelStep, VIDEO_ZOOM.min),
          VIDEO_ZOOM.max,
        ),
      )
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("wheel", handleWheel)
    }
  }, [])

  const isInCenter = isHovering && Math.abs(mouse.x) < 0.3 && Math.abs(mouse.y) < 0.3
  const activeZoom = isInCenter ? Math.min(zoom + VIDEO_ZOOM.centerBonus, VIDEO_ZOOM.max) : zoom

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${VIDEO_ZOOM.bleedPercent}%`,
            height: `${VIDEO_ZOOM.bleedPercent}%`,
            transform: `translate(-50%, -50%) translate(${mouse.x * VIDEO_ZOOM.parallaxPx}px, ${mouse.y * VIDEO_ZOOM.parallaxPx}px)`,
            transition: "transform 0.8s ease-out",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover bg-black"
            style={{
              transform: `scale(${activeZoom})`,
              transformOrigin: "center center",
              transition: "transform 0.8s ease-out",
            }}
          >
            <source src={site.videoSrcWebm} type="video/webm" />
            <source src={site.videoSrcMp4} type="video/mp4" />
          </video>
        </div>
      </div>
      <div
        className="relative z-10 h-screen overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
      <div className="absolute inset-x-0 top-0 pt-6 md:pt-8">
        <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
          <span className="font-mono text-xs md:text-base text-vesper-accent whitespace-nowrap">
            Hi, I am {site.name} — {site.locationLine}
          </span>
          <span className="text-vesper-purple/40 font-mono">·</span>
          {site.marqueeOrgs.flatMap((org) => [
            <a
              key={org.label}
              href={org.href}
              target={org.href.startsWith("http") ? "_blank" : undefined}
              rel={org.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`font-mono text-xs md:text-base text-vesper-accent ${GLOW} whitespace-nowrap`}
            >
              {org.label}
            </a>,
            <span key={`${org.label}-sep`} className="text-vesper-purple/40 font-mono">·</span>,
          ])}
          {ghStats && (
            <span className="font-mono text-xs md:text-base text-vesper-accent/70 whitespace-nowrap">
              {ghStats.today} commits today · {ghStats.month} this month · {ghStats.year} this year · {ghStats.total} total
            </span>
          )}
          {ghStats && <span className="text-vesper-purple/40 font-mono">·</span>}
          {ghStats?.lastCommit && (
            <a
              href={ghStats.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-mono text-xs md:text-base text-vesper-accent/70 whitespace-nowrap ${GLOW}`}
            >
              last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
            </a>
          )}
          {ghStats?.lastCommit && <span className="text-vesper-purple/40 font-mono">·</span>}
        </InfiniteSlider>
      </div>
      <div className="absolute inset-x-0 md:inset-x-auto md:right-8 top-14 md:top-24 font-mono text-xs md:text-sm flex items-center justify-center md:justify-end gap-3 px-4 md:px-0">
        {musicPlaying ? (
          <a
            href={`https://www.youtube.com/watch?v=${YT_TRACKS[trackIndex].id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#A8E0E0] whitespace-nowrap transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.6)] max-w-[60vw] md:max-w-none overflow-hidden text-ellipsis"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            <span className="sound-bars"><span /><span /><span /><span /></span>
            now playing: {YT_TRACKS[trackIndex].title}
          </a>
        ) : (
          <button
            onClick={toggleMusic}
            className="text-vesper-accent/60 whitespace-nowrap transition-all duration-300 hover:text-[#A8E0E0] hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.6)] cursor-pointer"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            click to listen <span className="sound-bars"><span /><span /><span /><span /></span>
          </button>
        )}
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={prevTrack} className={`text-vesper-accent ${GLOW} hover:scale-125`} aria-label="Previous track">
            <SkipBack size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={toggleMusic} className={`text-vesper-accent ${GLOW} hover:scale-125`} aria-label={musicPlaying ? "Mute music" : "Play music"}>
            {musicPlaying ? <Volume2 size={18} className="md:w-[22px] md:h-[22px]" /> : <VolumeX size={18} className="md:w-[22px] md:h-[22px]" />}
          </button>
          <button onClick={nextTrack} className={`text-vesper-accent ${GLOW} hover:scale-125`} aria-label="Next track">
            <SkipForward size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={randomTrack} className={`text-vesper-accent ${GLOW} hover:scale-125`} aria-label="Random track">
            <Shuffle size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col md:flex-row md:items-end md:justify-between px-4 md:px-16 pb-8 md:pb-12 gap-4 md:gap-0">
        <div className={`font-sans text-2xl md:text-3xl font-semibold text-vesper-accent tracking-tight text-left cursor-default ${GLOW} md:w-[30%]`}>
          <TextLoop interval={2.5} transition={{ duration: 0.4 }}>
            {PROFESSIONS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </TextLoop>
        </div>
        <p
          className={`font-sans text-base md:text-xl font-normal leading-relaxed text-vesper-accent/85 md:max-w-md text-left md:text-right cursor-default ${GLOW} whitespace-pre-line`}
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
      </div>
      <div className="absolute w-0 h-0 overflow-hidden">
        <div id="yt-player" ref={playerContainerRef} />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 md:left-8 md:right-auto md:top-24 md:translate-y-0 md:flex-row md:gap-5">
        {site.socials.map((social) => {
          const Icon = SOCIAL_ICONS[social.icon]
          if (!Icon) return null
          const external = social.href.startsWith("http")
          return (
            <a
              key={social.id}
              href={social.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className={`text-vesper-accent ${GLOW} hover:scale-125`}
              aria-label={social.id}
            >
              <Icon size={24} className="md:w-[26px] md:h-[26px]" />
            </a>
          )
        })}
      </div>
      </div>
    </>
  )
}
