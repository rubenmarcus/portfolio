import { ArrowLeft, Github, Mail, Twitter } from "lucide-react"
import Link from "next/link"
import ContactForm from "@/components/contact-form"

export default function Contact() {
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
          Contact
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <p className="text-green-300/80 font-mono mb-8">
            Interested in working together? Have questions about blockchain development or my projects? Feel free to
            reach out through the form or via the contact methods below.
          </p>

          <div className="space-y-4 mb-8">
            <a
              href="mailto:contact@example.com"
              className="flex items-center text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              <Mail className="mr-2 h-5 w-5" />
              contact@example.com
            </a>
            <a
              href="https://github.com/username"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              <Github className="mr-2 h-5 w-5" />
              github.com/username
            </a>
            <a
              href="https://twitter.com/username"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              <Twitter className="mr-2 h-5 w-5" />
              @username
            </a>
          </div>

          <div className="p-4 border border-green-500/30 bg-green-500/5 font-mono text-green-300/80">
            <h3 className="text-green-400 font-semibold mb-2">Available for:</h3>
            <ul className="list-disc list-inside">
              <li>Smart Contract Development</li>
              <li>Web3 Consulting</li>
              <li>DeFi Protocol Design</li>
              <li>Technical Workshops</li>
              <li>Speaking Engagements</li>
            </ul>
          </div>
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
