"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus("success")

      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null)
      }, 5000)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block font-mono text-green-400 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full bg-transparent border border-green-500/30 focus:border-green-500 outline-none px-3 py-2 text-green-400 font-mono"
        />
      </div>

      <div>
        <label htmlFor="email" className="block font-mono text-green-400 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full bg-transparent border border-green-500/30 focus:border-green-500 outline-none px-3 py-2 text-green-400 font-mono"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block font-mono text-green-400 mb-1">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full bg-black border border-green-500/30 focus:border-green-500 outline-none px-3 py-2 text-green-400 font-mono"
        >
          <option value="">Select a subject</option>
          <option value="Project Inquiry">Project Inquiry</option>
          <option value="Consulting">Consulting</option>
          <option value="Speaking Engagement">Speaking Engagement</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block font-mono text-green-400 mb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full bg-transparent border border-green-500/30 focus:border-green-500 outline-none px-3 py-2 text-green-400 font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 px-4 py-3 font-mono transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span>Sending...</span>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </button>

      {submitStatus === "success" && (
        <div className="p-3 border border-green-500/30 bg-green-500/10 text-green-400 font-mono">
          Your message has been sent successfully. I&apos;ll get back to you soon!
        </div>
      )}

      {submitStatus === "error" && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 font-mono">
          There was an error sending your message. Please try again later.
        </div>
      )}
    </form>
  )
}
