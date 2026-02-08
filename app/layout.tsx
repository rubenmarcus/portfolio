import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Martian_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const martianMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Ruben Marcus | AI Fullstack & Web3 Engineer",
  description: "Ruben Marcus — prompt engineer, AI fullstack engineer, web3 engineer, frontend engineer, and vibecoder. Building the future of AI and crypto, one prompt at a time.",
  keywords: ["Ruben Marcus", "AI engineer", "web3 engineer", "fullstack engineer", "prompt engineer", "blockchain developer", "crypto", "vibecoder", "frontend engineer"],
  authors: [{ name: "Ruben Marcus", url: "https://rubenmarcus.dev" }],
  creator: "Ruben Marcus",
  metadataBase: new URL("https://rubenmarcus.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rubenmarcus.dev",
    title: "Ruben Marcus | AI Fullstack & Web3 Engineer",
    description: "Building the future of AI and crypto. One prompt at a time.",
    siteName: "Ruben Marcus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ruben Marcus | AI Fullstack & Web3 Engineer",
    description: "Building the future of AI and crypto. One prompt at a time.",
    creator: "@rubenmarcus_dev",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Ruben Marcus",
              url: "https://rubenmarcus.dev",
              jobTitle: "AI Fullstack & Web3 Engineer",
              description: "Building the future of AI and crypto. One prompt at a time.",
              sameAs: [
                "https://github.com/rubenmarcus",
                "https://x.com/rubenmarcus_dev",
                "https://linkedin.com/in/rubenmarcus",
                "https://t.me/rubenmarcus",
              ],
              knowsAbout: ["AI", "Web3", "Blockchain", "Smart Contracts", "Prompt Engineering", "Frontend Development", "Crypto"],
              worksFor: [
                { "@type": "Organization", name: "MultiVM Labs", url: "https://multivmlabs.com" },
                { "@type": "Organization", name: "Ralph Starter", url: "https://ralphstarter.ai" },
              ],
            }),
          }}
        />
      </head>
      <body className={`${martianMono.variable} font-mono bg-black text-green-400`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
