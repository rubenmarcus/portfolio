"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function ChainSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const chains = [
    { name: "Ethereum", icon: "/icons/crypto/ethereum.svg" },
    { name: "Base", icon: "/icons/crypto/base.svg" },
    { name: "Near", icon: "/icons/crypto/near.svg" },
    { name: "Solana", icon: "/icons/crypto/solana.svg" },
    { name: "Sui", icon: "/icons/crypto/sui.svg" },
    { name: "Gnosis", icon: "/icons/crypto/gnosis.svg" },
  ]

  return (
    <div className="overflow-hidden" ref={containerRef}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {chains.map((chain, index) => (
          <motion.div
            key={chain.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col items-center justify-center p-6 border border-green-500/20 bg-black/80 hover:bg-green-950/20 transition-colors rounded-md"
          >
            <div className="w-16 h-16 flex items-center justify-center mb-4 border border-green-500/30 rounded-full bg-black p-3">
              <Image
                src={chain.icon}
                alt={`${chain.name} logo`}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-mono text-green-400">{chain.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
