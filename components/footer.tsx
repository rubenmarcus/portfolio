import Link from "next/link"
import { Github, Linkedin, Mail, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-green-500/20 bg-black">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-mono text-lg font-bold mb-4 text-green-400">Navigation</h3>
            <ul className="space-y-2 font-mono">
              <li>
                <Link href="/" className="text-green-400/80 hover:text-green-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-green-400/80 hover:text-green-300 transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-400/80 hover:text-green-300 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-400/80 hover:text-green-300 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-lg font-bold mb-4 text-green-400">Connect</h3>
            <ul className="space-y-2 font-mono">
              <li>
                <a
                  href="https://github.com/username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-400/80 hover:text-green-300 transition-colors"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-400/80 hover:text-green-300 transition-colors"
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-400/80 hover:text-green-300 transition-colors"
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@example.com"
                  className="flex items-center text-green-400/80 hover:text-green-300 transition-colors"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-lg font-bold mb-4 text-green-400">Newsletter</h3>
            <p className="text-green-400/80 mb-4 font-mono">
              Subscribe to receive updates on Web3 development and my latest projects.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="bg-transparent border border-green-500/30 focus:border-green-500 outline-none px-3 py-2 text-green-400 font-mono w-full"
                required
              />
              <button
                type="submit"
                className="bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 px-4 py-2 font-mono transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-green-500/20 text-center text-green-400/60 font-mono text-sm">
          &copy; {new Date().getFullYear()} Web3 Engineer. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
