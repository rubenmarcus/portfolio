import { ArrowRight } from "lucide-react"
import MatrixBackground from "@/components/matrix-background"
import ChainSection from "@/components/chain-section"
import ProjectCard from "@/components/project-card"
import BlogPost from "@/components/blog-post"
import TerminalText from "@/components/terminal-text"
import CyberpunkButton from "@/components/cyberpunk-button"

export default function Home() {
  const openSourceProjects = [
    {
      title: "Ethereum DeFi Dashboard",
      description: "Open-source dashboard for tracking DeFi positions across multiple protocols",
      tags: ["Ethereum", "React", "Web3.js"],
      link: "#",
      github: "https://github.com/username/defi-dashboard",
    },
    {
      title: "Solana NFT Marketplace",
      description: "Decentralized marketplace for NFTs on Solana",
      tags: ["Solana", "Rust", "Next.js"],
      link: "#",
      github: "https://github.com/username/solana-nft-marketplace",
    },
    {
      title: "Smart Contract Library",
      description: "Collection of audited, reusable smart contracts for common Web3 patterns",
      tags: ["Solidity", "Security", "ERC Standards"],
      link: "#",
      github: "https://github.com/username/smart-contract-library",
    },
  ]

  const closedSourceProjects = [
    {
      title: "Enterprise Blockchain Solution",
      description: "Private blockchain implementation for a Fortune 500 company",
      tags: ["Hyperledger", "Node.js", "Private Blockchain"],
      link: "#",
    },
    {
      title: "Crypto Trading Platform",
      description: "High-frequency trading platform for institutional investors",
      tags: ["Trading", "API", "Real-time"],
      link: "#",
    },
    {
      title: "Cross-chain Bridge",
      description: "Secure bridge for transferring assets between multiple blockchains",
      tags: ["Cross-chain", "Security", "Solidity"],
      link: "#",
    },
  ]

  const aiAgents = [
    {
      title: "Trading Bot",
      description: "AI-powered trading bot for DeFi protocols",
      tags: ["AI", "Trading", "DeFi"],
      link: "#",
    },
    {
      title: "Smart Contract Auditor",
      description: "AI agent that scans for vulnerabilities in smart contracts",
      tags: ["Security", "AI", "Auditing"],
      link: "#",
    },
    {
      title: "Sentiment Analyzer",
      description: "Real-time crypto market sentiment analysis from social media",
      tags: ["NLP", "Social Media", "Market Analysis"],
      link: "#",
    },
  ]

  const blogPosts = [
    {
      title: "The Future of Web3 Development",
      excerpt: "Exploring the evolving landscape of decentralized applications and what's next for Web3 developers.",
      date: "2023-12-15",
      link: "#",
    },
    {
      title: "Securing Smart Contracts: Best Practices",
      excerpt: "A comprehensive guide to writing secure smart contracts and avoiding common vulnerabilities.",
      date: "2023-11-02",
      link: "#",
    },
    {
      title: "AI Agents in Blockchain: Use Cases and Implementation",
      excerpt: "How AI is transforming blockchain applications and creating new opportunities for automation.",
      date: "2023-09-18",
      link: "#",
    },
  ]

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden border-b border-green-500/20">
        <MatrixBackground />
        <div className="container relative z-10 px-4 text-center">
          <h1 className="font-mono text-3xl md:text-6xl font-bold mb-4 text-green-400 tracking-tight">
          Senior Fullstack Web3 Engineer
          </h1>
          <p className="font-mono text-lg md:text-xl text-green-300/80 max-w-2xl mx-auto mb-8">
            Building the decentralized future with code. Specializing in blockchain, smart contracts, and AI
            integration.
          </p>
          <CyberpunkButton
            href="/portfolio"
            className="inline-flex items-center px-6 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors font-mono rounded-sm group"
          >
            View My Work
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </CyberpunkButton>
        </div>
      </section>

      {/* Chains Section */}
      <section className="py-16 border-b border-green-500/20">
        <div className="container px-4">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
            <TerminalText text="Blockchain Expertise" typingSpeed={30} />
          </h2>
          <ChainSection />
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-16 border-b border-green-500/20">
        <div className="container px-4">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
            <TerminalText text="AI Agents" typingSpeed={30} />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiAgents.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Projects Section */}
      <section className="py-16 border-b border-green-500/20">
        <div className="container px-4">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
            <TerminalText text="Open Source Projects" typingSpeed={30} />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openSourceProjects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Closed Source Projects Section */}
      <section className="py-16 border-b border-green-500/20">
        <div className="container px-4">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
            <TerminalText text="Closed Source Projects" typingSpeed={30} />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closedSourceProjects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog/Articles Section */}
      <section className="py-16 border-b border-green-500/20">
        <div className="container px-4">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-8 text-green-400 after:content-[''] after:block after:w-24 after:h-px after:bg-green-500 after:mt-2">
            <TerminalText text="Blog & Articles" typingSpeed={30} />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <BlogPost key={index} post={post} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <CyberpunkButton
              href="#"
              className="inline-flex items-center px-6 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors font-mono rounded-sm group"
            >
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </CyberpunkButton>
          </div>
        </div>
      </section>
    </div>
  )
}
