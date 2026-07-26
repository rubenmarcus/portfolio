import { useEffect, useId, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { site } from "../config/site"

type ContactModalProps = {
  open: boolean
  onClose: () => void
  /** Rotating role shown when the user opened the modal */
  contextRole: string
}

const fieldClass =
  "w-full bg-black/30 border border-vesper-accent/50 px-3 py-2.5 font-mono text-sm text-vesper-accent placeholder:text-vesper-accent/35 outline-none transition-colors focus:border-vesper-accent focus:shadow-[0_0_12px_rgba(0,240,255,0.25)]"

export function ContactModal({ open, onClose, contextRole }: ContactModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    const email = String(fd.get("email") ?? "").trim()
    const subject = String(fd.get("subject") ?? "").trim()
    const message = String(fd.get("message") ?? "").trim()
    const fullSubject = `[${contextRole}] ${subject || "Contact"}`
    const body = `Name: ${name}\nEmail: ${email}\nRole context: ${contextRole}\n\n${message}`
    const mailto = `mailto:${site.email}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            aria-label="Close contact form"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md border border-vesper-accent/70 bg-black/55 px-6 py-8 shadow-[0_0_40px_rgba(0,240,255,0.15),inset_0_0_60px_rgba(0,240,255,0.03)] backdrop-blur-md"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-vesper-accent/70 transition-colors hover:text-vesper-accent"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <p id={titleId} className="sr-only">
              Contact {site.brand}
            </p>
            <p className="mb-6 font-mono text-xs tracking-wide text-vesper-accent/60">
              secure channel · {contextRole}
            </p>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-sm text-vesper-accent/90">Name</span>
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className={fieldClass}
                  placeholder="Your name"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-sm text-vesper-accent/90">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={fieldClass}
                  placeholder="you@example.com"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-sm text-vesper-accent/90">Subject</span>
                <input
                  name="subject"
                  type="text"
                  key={contextRole}
                  defaultValue={`Inquiry — ${contextRole}`}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-sm text-vesper-accent/90">Message</span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className={`${fieldClass} resize-y min-h-[100px]`}
                  placeholder="Tell me what you're building…"
                />
              </label>
              <button
                type="submit"
                className="mt-1 w-full border border-vesper-pink py-3 font-mono text-sm text-vesper-pink transition-all hover:bg-vesper-pink/10 hover:shadow-[0_0_24px_rgba(255,42,158,0.35)]"
              >
                Encrypt and send
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
