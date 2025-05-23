import { ArrowLeft } from "lucide-react"
import ProjectGrid from "@/components/project-grid"
import TerminalText from "@/components/terminal-text"
import CyberpunkButton from "@/components/cyberpunk-button"

export default function Portfolio() {
  const projects = [
    {
      title: "Ethereum DeFi Dashboard",
      description: "Open-source dashboard for tracking DeFi positions across multiple protocols",
      tags: ["Ethereum", "React", "Web3.js"],
      link: "#",
      github: "https://github.com/username/defi-dashboard",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Solana NFT Marketplace",
      description: "Decentralized marketplace for NFTs on Solana",
      tags: ["Solana", "Rust", "Next.js"],
      link: "#",
      github: "https://github.com/username/solana-nft-marketplace",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Smart Contract Library",
      description: "Collection of audited, reusable smart contracts for common Web3 patterns",
      tags: ["Solidity", "Security", "ERC Standards"],
      link: "#",
      github: "https://github.com/username/smart-contract-library",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Enterprise Blockchain Solution",
      description: "Private blockchain implementation for a Fortune 500 company",
      tags: ["Hyperledger", "Node.js", "Private Blockchain"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Crypto Trading Platform",
      description: "High-frequency trading platform for institutional investors",
      tags: ["Trading", "API", "Real-time"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Cross-chain Bridge",
      description: "Secure bridge for transferring assets between multiple blockchains",
      tags: ["Cross-chain", "Security", "Solidity"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Trading Bot",
      description: "AI-powered trading bot for DeFi protocols",
      tags: ["AI", "Trading", "DeFi"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Smart Contract Auditor",
      description: "AI agent that scans for vulnerabilities in smart contracts",
      tags: ["Security", "AI", "Auditing"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      title: "Sentiment Analyzer",
      description: "Real-time crypto market sentiment analysis from social media",
      tags: ["NLP", "Social Media", "Market Analysis"],
      link: "#",
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  return (
    <div className="container px-4 py-16">
      <div className="mb-8">
        <CyberpunkButton
          href="/"
          className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors font-mono group mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </CyberpunkButton>
        <h1 className="font-mono text-3xl md:text-4xl font-bold text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
          <TerminalText text="Portfolio" typingSpeed={50} />
        </h1>
        <p className="mt-4 text-green-300/80 max-w-2xl font-mono">
          <TerminalText
            text="A collection of my work across blockchain platforms, AI integration, and fullstack development. Filter projects by technology or view all."
            typingSpeed={20}
            glitchIntensity={1}
          />
        </p>
      </div>

      <ProjectGrid projects={projects} />
    </div>
  )
}
