import { useState, useEffect, useRef, useCallback } from "react"
import { Github, Linkedin, Twitter, Mail, Send, Volume2, VolumeX, SkipBack, SkipForward, Shuffle } from "lucide-react"
import { TextLoop } from "./TextLoop"
import { InfiniteSlider } from "./InfiniteSlider"

const YT_TRACKS = [
  { id: "zWeYcNfYn3U", start: 180, title: "Prince Of Denmark - GS [FORUM V]" },
  { id: "nA-ZaQn55Eg", start: 785, title: "最初のプログラム" },
  { id: "DrmpZtxr0kY", start: 600, title: "Nostalgic Soundscapes - Forgotten" },
  { id: "vXLyxy3GTaY", start: 0, title: "MICROMECHA - Underwater Quest" },
  { id: "nII4LjJECRA", start: 0, title: "silver protocol - frutiger aero" },
  { id: "xp8HbdSLDgo", start: 132, title: "Aphex Twin - Zahl am1 live track 1c f760m1 unfinshd" },
  { id: "0S43IwBF0uM", start: 0, title: "The Chemical Brothers - Star Guitar" },
  { id: "6HVofwARgOs", start: 0, title: "Nürnberg - Valasy" },
  { id: "QShW2JV2ne8", start: 266, title: "Aphex Twin - T08 dx1+5 [London 03.06.17]" },
  { id: "siS-d1bwKxA", start: 31, title: "The Future Sound of London - Papua New Guinea" },
  { id: "Qfh4i7JjOz4", start: 0, title: "The Tuss - Yellow Cellophane Day" },
  { id: "a0LR7E1grnM", start: 0, title: "Vektroid & New Dreams Ltd. - FOREST.SYS" },
  { id: "rT6RoxjxRQw", start: 0, title: "Ceephax Acid Crew - Amigo" },
  { id: "ko8cJucsbBU", start: 0, title: "Roy of the Ravers - EMOTINIUM" },
  { id: "4aeETEoNfOg", start: 11, title: "Smashing Pumpkins - 1979" },
  { id: "eBG7P-K-r1Y", start: 20, title: "Foo Fighters - Everlong" },
  { id: "Dy4HA3vUv2c", start: 20, title: "Blue Oyster Cult - (Don't Fear) The Reaper" },
  { id: "vZexE7wAvBE", start: 0, title: "Kosheen - Hide U" },
  { id: "SesCS4QHOfg", start: 0, title: "Napa - Na Lua" },
  { id: "LbYwT6TULjg", start: 0, title: "Mac DeMarco - Freaking Out the Neighborhood" },
  { id: "OMaycNcPsHI", start: 0, title: "Placebo - Every You Every Me" },
  { id: "hqqxtKaCjxQ", start: 10, title: "R.E.M. - Radio Free Europe" },
  { id: "BGn2oo-0Dqc", start: 0, title: "Gorillaz - On Melancholy Hill" },
  { id: "RdlNrYmNdQ4", start: 0, title: "Sisters of Mercy - First and Last and Always" },
  { id: "1lyu1KKwC74", start: 8, title: "The Verve - Bitter Sweet Symphony" },
  { id: "YrKVG4JG9So", start: 0, title: "Plaid - Do Matter" },
  { id: "Bk1wUKoXL20", start: 0, title: "Morrissey - The Last Of The Famous International Playboys" },
]

const PROFESSIONS = [
  "prompt engineer",
  "AI fullstack engineer",
  "web3 engineer",
  "senior software engineer",
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

const GH_USER = "rubenmarcus"

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
  const [zoom, setZoom] = useState(1.15)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 1.2
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
      setZoom(prev => Math.min(Math.max(prev + e.deltaY * 0.001, 1.1), 1.5))
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("wheel", handleWheel)
    }
  }, [])

  const isInCenter = isHovering && Math.abs(mouse.x) < 0.3 && Math.abs(mouse.y) < 0.3
  const activeZoom = isInCenter ? zoom + 0.15 : zoom

  return (
    <div
      className="relative h-screen overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="fixed inset-0 -z-10"
        style={{
          transform: `translate(${mouse.x * 25}px, ${mouse.y * 25}px)`,
          transition: "transform 0.8s ease-out",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${activeZoom})`,
            transformOrigin: "center center",
            transition: "transform 0.8s ease-out",
          }}
        >
          <source src="/videobg.webm" type="video/webm" />
        </video>
      </div>
      <div className="absolute inset-x-0 top-0 pt-6 md:pt-8">
        <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
          <span className="font-mono text-xs md:text-base text-green-400 whitespace-nowrap">
            Hi, I am Ruben Marcus, a brazilian dev based in Lisbon, Portugal.
          </span>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://multivmlabs.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            deving @ MultiVM Labs
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://ralphstarter.ai" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            clauding ralph-starter
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          <a href="https://rubenluz.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 whitespace-nowrap">
            I do photography also
          </a>
          <span className="text-green-500/40 font-mono">·</span>
          {ghStats && (
            <span className="font-mono text-xs md:text-base text-green-400/70 whitespace-nowrap">
              {ghStats.today} commits today · {ghStats.month} this month · {ghStats.year} this year · {ghStats.total} total
            </span>
          )}
          {ghStats && <span className="text-green-500/40 font-mono">·</span>}
          {ghStats?.lastCommit && (
            <a href={ghStats.lastCommit.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs md:text-base text-green-400/70 whitespace-nowrap transition-all duration-300 hover:text-green-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
              last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
            </a>
          )}
          {ghStats?.lastCommit && <span className="text-green-500/40 font-mono">·</span>}
        </InfiniteSlider>
      </div>
      <div className="absolute inset-x-0 md:inset-x-auto md:right-8 top-14 md:top-24 font-mono text-xs md:text-sm flex items-center justify-center md:justify-end gap-3 px-4 md:px-0">
        {musicPlaying ? (
          <a href={`https://www.youtube.com/watch?v=${YT_TRACKS[trackIndex].id}`} target="_blank" rel="noopener noreferrer" className="text-green-300 whitespace-nowrap transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] max-w-[60vw] md:max-w-none overflow-hidden text-ellipsis" style={{ animation: "glow-pulse 2s ease-in-out infinite" }}>
            <span className="sound-bars"><span /><span /><span /><span /></span>
            now playing: {YT_TRACKS[trackIndex].title}
          </a>
        ) : (
          <button onClick={toggleMusic} className="text-green-300/60 whitespace-nowrap transition-all duration-300 hover:text-green-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] cursor-pointer" style={{ animation: "glow-pulse 2s ease-in-out infinite" }}>
            click to listen <span className="sound-bars"><span /><span /><span /><span /></span>
          </button>
        )}
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={prevTrack} className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125" aria-label="Previous track">
            <SkipBack size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={toggleMusic} className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125" aria-label={musicPlaying ? "Mute music" : "Play music"}>
            {musicPlaying ? <Volume2 size={18} className="md:w-[22px] md:h-[22px]" /> : <VolumeX size={18} className="md:w-[22px] md:h-[22px]" />}
          </button>
          <button onClick={nextTrack} className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125" aria-label="Next track">
            <SkipForward size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={randomTrack} className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125" aria-label="Random track">
            <Shuffle size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col md:flex-row md:items-end md:justify-between px-4 md:px-16 pb-8 md:pb-12 gap-4 md:gap-0">
        <div className="font-mono text-2xl md:text-3xl font-normal text-green-400 tracking-tight text-left cursor-default transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 md:w-[30%]">
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
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 md:left-8 md:right-auto md:top-24 md:translate-y-0 md:flex-row md:gap-5">
        <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Github size={24} className="md:w-[26px] md:h-[26px]" />
        </a>
        <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Twitter size={24} className="md:w-[26px] md:h-[26px]" />
        </a>
        <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Linkedin size={24} className="md:w-[26px] md:h-[26px]" />
        </a>
        <a href="mailto:ruben@rubenmarcus.dev" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Mail size={24} className="md:w-[26px] md:h-[26px]" />
        </a>
        <a href="https://t.me/rubenmarcus" target="_blank" rel="noopener noreferrer" className="text-green-400 transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:text-green-300 hover:scale-125">
          <Send size={24} className="md:w-[26px] md:h-[26px]" />
        </a>
      </div>
    </div>
  )
}
