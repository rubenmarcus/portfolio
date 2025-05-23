import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Timeline from "@/components/timeline"
import MatrixBackground from "@/components/matrix-background"

export default function About() {
  const timelineEvents = [
    {
      year: "2023",
      title: "Lead Blockchain Engineer",
      description: "Leading development of cross-chain infrastructure at a major Web3 company",
    },
    {
      year: "2021",
      title: "Senior Smart Contract Developer",
      description: "Developed and audited smart contracts for DeFi protocols",
    },
    {
      year: "2019",
      title: "Fullstack Engineer",
      description: "Built frontend and backend systems for blockchain applications",
    },
    {
      year: "2017",
      title: "Open Source Contributor",
      description: "Started contributing to Ethereum and other blockchain projects",
    },
    {
      year: "2015",
      title: "Software Engineer",
      description: "Began career as a web developer before transitioning to blockchain",
    },
  ]

  return (
    <div className="container px-4 py-16 relative">
      {/* Minimal Matrix Rain - positioned with low opacity in background */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
      </div>

      <div className="mb-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors font-mono group mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="terminal-container relative inline-block mb-2">
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-green-400 border-b-2 border-green-500 pb-1
            relative inline-block overflow-hidden  z-10">
            About Me
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="order-2 md:order-1">
          <h2 className="font-mono text-2xl font-bold mb-4 text-green-400 glitch-section-title">Background</h2>
          <div className="space-y-4 text-green-300/80 font-mono">
            <p>
              I'm a Senior Fullstack Web3 Engineer with over 8 years of experience in software development, with the
              last 6 years focused on blockchain technology and decentralized applications.
            </p>
            <p>
              My expertise spans across multiple blockchain platforms including Ethereum, Solana, and Polkadot, with a
              deep understanding of smart contract development, security best practices, and fullstack integration.
            </p>
            <p>
              I'm passionate about the intersection of AI and blockchain, creating autonomous agents that can interact
              with on-chain data and smart contracts to create new possibilities for decentralized systems.
            </p>
            <p>
              When I'm not coding, I contribute to open source projects, write technical articles, and speak at
              blockchain conferences around the world.
            </p>
          </div>

          <h2 className="font-mono text-2xl font-bold mt-8 mb-4 text-green-400 glitch-section-title">Skills</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-mono text-lg font-semibold mb-2 text-green-400">Languages</h3>
              <ul className="list-disc list-inside text-green-300/80 font-mono">
                <li>Solidity</li>
                <li>Rust</li>
                <li>JavaScript/TypeScript</li>
                <li>Python</li>
                <li>Go</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-lg font-semibold mb-2 text-green-400">Technologies</h3>
              <ul className="list-disc list-inside text-green-300/80 font-mono">
                <li>Ethereum/EVM</li>
                <li>Solana</li>
                <li>React/Next.js</li>
                <li>Node.js</li>
                <li>Web3.js/ethers.js</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 flex justify-center">
          <div className="relative w-64 h-64 border border-green-500 p-1 rounded-sm overflow-hidden transform-gpu perspective-[800px] hover:animate-none group">
            {/* Black background base */}
            <div className="absolute inset-0 bg-black z-0" />

            {/* 3D Glitch layers */}
            <div className="absolute inset-0 z-10 transform-gpu translate-z-0 group-hover:translate-z-2 transition-transform duration-300">
              <Image
                src="/rubenmarcus.jpeg"
                alt="Profile"
                width={256}
                height={256}
                className="w-full h-full object-contain grayscale brightness-75 contrast-125"
                style={{ mixBlendMode: "screen" }}
              />
            </div>

            <div className="absolute inset-0 z-10 transform-gpu -translate-x-[1px] translate-z-2 group-hover:translate-z-4 opacity-70 animate-glitch-1">
              <Image
                src="/rubenmarcus.jpeg"
                alt=""
                width={256}
                height={256}
                className="w-full h-full object-contain grayscale brightness-75 contrast-125 opacity-60"
                style={{ mixBlendMode: "screen", filter: "hue-rotate(90deg)" }}
              />
            </div>

            <div className="absolute inset-0 z-10 transform-gpu translate-x-[1px] translate-z-1 group-hover:translate-z-3 opacity-70 animate-glitch-2">
              <Image
                src="/rubenmarcus.jpeg"
                alt=""
                width={256}
                height={256}
                className="w-full h-full object-contain grayscale brightness-75 contrast-125 opacity-60"
                style={{ mixBlendMode: "screen", filter: "hue-rotate(180deg)" }}
              />
            </div>

            {/* Green overlay for terminal effect */}
            <div className="absolute inset-0 bg-green-900/50 mix-blend-color z-20" />

            {/* Background-specific glitch effects */}
            <div className="absolute inset-0 bg-[linear-gradient(0deg,_transparent_0%,_#000_15%,_transparent_15.5%,_transparent_30%,_#000_30.5%,_transparent_31%,_transparent_45%,_#000_45.5%,_transparent_46%,_transparent_61%,_#000_61.5%,_transparent_62%,_transparent_79%,_#000_79.5%,_transparent_80%,_transparent_95%,_#000_95.5%)] bg-[length:100%_100%] z-21 animate-bg-glitch-slide mix-blend-screen" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_10%,_#000_10.5%,_transparent_11%,_transparent_29%,_#000_29.5%,_transparent_30%,_transparent_48%,_#000_48.5%,_transparent_49%,_transparent_68%,_#000_68.5%,_transparent_69%,_transparent_88%,_#000_88.5%,_transparent_89%)] bg-[length:100%_100%] z-21 animate-bg-glitch-slide-h mix-blend-screen" />

            {/* White background mask for targeted effects */}
            <div className="absolute inset-0 opacity-60 z-22 mix-blend-lighten">
              <Image
                src="/rubenmarcus.jpeg"
                alt=""
                width={256}
                height={256}
                className="w-full h-full object-contain brightness-200 contrast-200 invert opacity-50"
                style={{ filter: "brightness(2) contrast(5) invert(1)" }}
              />
            </div>

            {/* Data corruption effect on white areas */}
            <div className="absolute inset-0 bg-[url('/glitch-noise.png')] bg-repeat opacity-30 z-23 mix-blend-multiply animate-data-corruption" />
            <div className="absolute inset-0 overflow-hidden z-24">
              <div className="w-full h-full relative animate-bg-glitch-clip opacity-70">
                <div className="absolute w-full h-10 bg-[#00ff00] top-1/2 -translate-y-1/2 opacity-20 blur-sm animate-glitch-bar" />
                <div className="absolute w-10 h-full bg-[#00ff00] left-1/4 opacity-20 blur-sm animate-glitch-bar-v" />
              </div>
            </div>

            {/* Scan lines */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0px,_rgba(0,255,0,0.1)_1px,_transparent_2px,_transparent_4px)] bg-[length:100%_4px] z-30 pointer-events-none opacity-40" />

            {/* Glitch effects */}
            <div className="absolute inset-0 bg-green-500/10 z-25 animate-flicker" />
            <div className="absolute inset-0 translate-x-[0.5px] opacity-70 z-15 animate-glitch-1" />
            <div className="absolute inset-0 -translate-x-[0.5px] opacity-70 z-15 animate-glitch-2" />
            <div className="absolute inset-0 clip-path-glitch z-35 animate-glitch-skew transform-gpu group-hover:skew-x-2 group-hover:scale-[1.02] transition-transform" />

            {/* 3D depth slices that respond to hover */}
            <div className="absolute inset-0 bg-green-500/5 z-36 transform-gpu translate-z-0 group-hover:translate-z-4 transition-transform opacity-0 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-green-500/5 z-37 transform-gpu translate-z-0 group-hover:translate-z-8 transition-transform opacity-0 group-hover:opacity-100 scale-[1.01]" />
            <div className="absolute inset-0 bg-green-500/5 z-38 transform-gpu translate-z-0 group-hover:translate-z-12 transition-transform opacity-0 group-hover:opacity-100 scale-[1.02]" />

            {/* Blinking cursor */}
            <div className="absolute bottom-3 right-3 w-2 h-4 bg-green-400 animate-blink" />

            {/* Green outline/border */}
            <div className="absolute inset-0 border-2 border-green-400/40 z-40" />

            {/* Terminal header */}
            <div className="absolute top-0 left-0 w-full bg-green-900/80 text-green-400 font-mono text-xs p-1 flex items-center z-50">
              <span className="mr-auto">user@web3-portfolio:~</span>
              <span className="ml-auto animate-pulse">▶</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="font-mono text-2xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2 glitch-section-title">
          Career Timeline
        </h2>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  )
}
