import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Timeline from "@/components/timeline"

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
    <div className="container px-4 py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors font-mono group mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <h1 className="font-mono text-3xl md:text-4xl font-bold text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2 glitch-title">
          About Me
        </h1>
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
          <div className="relative w-64 h-64 border border-green-500 p-1 rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-green-500/10 z-0"></div>
            <Image
              src="/placeholder.svg?height=256&width=256"
              alt="Profile"
              width={256}
              height={256}
              className="relative z-10 grayscale mix-blend-screen"
            />
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
