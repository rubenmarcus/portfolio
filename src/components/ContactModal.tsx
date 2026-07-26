import { useEffect, useId, useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Copy, Check, ExternalLink } from "lucide-react"
import { site } from "../config/site"
import {
  buildEncryptedMailto,
  createDecryptionPassphrase,
  createEnvelopeId,
  encryptContactPayload,
} from "../lib/contactEncrypt"
import { TurnstileField, turnstileEnabled } from "./TurnstileField"

type ContactModalProps = {
  open: boolean
  onClose: () => void
  contextRole: string
}

type SuccessState = {
  envelopeId: string
  passphrase: string
}

type FallbackState = {
  envelopeId: string
  passphrase: string
  armored: string
  mailtoHref: string
  mailtoTruncated: boolean
}

const fieldClass =
  "w-full bg-black/30 border border-vesper-accent/50 px-3 py-2.5 font-mono text-sm text-vesper-accent placeholder:text-vesper-accent/35 outline-none transition-colors focus:border-vesper-accent focus:shadow-[0_0_12px_rgba(0,240,255,0.25)]"

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function sendEncryptedEmail(payload: {
  envelopeId: string
  armored: string
  visitorEmail: string
  subjectLine: string
  company: string
  turnstileToken?: string
}): Promise<void> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (res.ok) return
  const data = (await res.json().catch(() => null)) as { error?: string } | null
  throw new Error(data?.error ?? "send_failed")
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs text-vesper-accent/80">{label}</span>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 break-all border border-vesper-accent/40 bg-black/40 px-2 py-2 font-mono text-xs text-vesper-accent/90">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 border border-vesper-accent/50 px-2 text-vesper-accent transition-colors hover:border-vesper-accent"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}

export function ContactModal({ open, onClose, contextRole }: ContactModalProps) {
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [fallback, setFallback] = useState<FallbackState | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)

  useEffect(() => {
    if (open) return
    setSuccess(null)
    setFallback(null)
    setError(null)
    setBusy(false)
    setTurnstileToken(null)
    setTurnstileKey((k) => k + 1)
  }, [open])

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFallback(null)
    setBusy(true)

    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    const email = String(fd.get("email") ?? "").trim()
    const subject = String(fd.get("subject") ?? "").trim()
    const message = String(fd.get("message") ?? "").trim()
    const company = String(fd.get("company") ?? "").trim()
    const envelopeId = createEnvelopeId()
    const passphrase = createDecryptionPassphrase()
    const subjectLine = `[${contextRole}] ${subject || "Contact"}`

    if (turnstileEnabled() && !turnstileToken) {
      setError("Completa la verificación anti-bot antes de enviar.")
      setBusy(false)
      return
    }

    let armored: string | null = null

    try {
      armored = await encryptContactPayload(
        {
          version: 1,
          envelopeId,
          sentAt: new Date().toISOString(),
          contextRole,
          name,
          email,
          subject,
          message,
        },
        passphrase,
      )

      await sendEncryptedEmail({
        envelopeId,
        armored,
        visitorEmail: email,
        subjectLine,
        company,
        turnstileToken: turnstileToken ?? undefined,
      })

      setSuccess({ envelopeId, passphrase })
    } catch (err) {
      const code = err instanceof Error ? err.message : "send_failed"
      if (armored) {
        const { href, truncated } = buildEncryptedMailto({
          to: site.email,
          envelopeId,
          visitorEmail: email,
          subjectLine,
          armored,
        })
        setFallback({ envelopeId, passphrase, armored, mailtoHref: href, mailtoTruncated: truncated })
      }

      if (code === "server_not_configured") {
        setError("El envío automático no está configurado en este entorno.")
      } else if (code === "rate_limited") {
        setError("Demasiados intentos. Espera un momento e inténtalo de nuevo.")
      } else {
        setError("No pudimos enviar el correo automáticamente. Usa el respaldo manual abajo.")
      }
      setTurnstileKey((k) => k + 1)
    } finally {
      setBusy(false)
    }
  }

  const { ageRepo, typageRepo, keyDeliverySocials } = site.contactCrypto

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
            className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto border border-vesper-accent/70 bg-black/55 px-6 py-8 shadow-[0_0_40px_rgba(0,240,255,0.15),inset_0_0_60px_rgba(0,240,255,0.03)] backdrop-blur-md"
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

            {success ? (
              <div className="flex flex-col gap-5 pr-6">
                <p className="font-mono text-xs tracking-wide text-vesper-accent/60">
                  sent · {success.envelopeId}
                </p>
                <p className="font-sans text-sm leading-relaxed text-vesper-accent/90">
                  El correo cifrado ya fue enviado a {site.email}.{" "}
                  <strong className="font-medium text-vesper-accent">Último paso:</strong> envíame la
                  llave por DM (no va en el email).
                </p>

                <CopyField label="Envelope ID (inclúyelo en el DM)" value={success.envelopeId} />
                <CopyField label="Decryption key (solo por redes)" value={success.passphrase} />

                <p className="font-mono text-xs text-vesper-accent/70">
                  {keyDeliverySocials.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 ? " · " : ""}
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vesper-pink underline-offset-2 hover:underline"
                      >
                        {s.label}
                      </a>
                    </span>
                  ))}
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full border border-vesper-accent/40 py-2 font-mono text-xs text-vesper-accent/70 hover:text-vesper-accent"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2 font-mono text-xs tracking-wide text-vesper-accent/60">
                  secure channel · {contextRole}
                </p>
                <p className="mb-5 font-mono text-[11px] leading-relaxed text-vesper-accent/50">
                  Cifrado en tu navegador con{" "}
                  <a
                    href={ageRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-vesper-accent/70 hover:text-vesper-accent"
                  >
                    age
                    <ExternalLink size={10} aria-hidden />
                  </a>{" "}
                  (
                  <a
                    href={typageRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vesper-accent/70 hover:text-vesper-accent"
                  >
                    typage
                  </a>
                  ). El servidor solo reenvía el sobre cifrado.
                </p>

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                    aria-hidden
                  />
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-sm text-vesper-accent/90">Name</span>
                    <input
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      className={fieldClass}
                      placeholder="Your name"
                      disabled={busy}
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
                      disabled={busy}
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
                      disabled={busy}
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
                      disabled={busy}
                    />
                  </label>
                  {error && (
                    <p className="font-mono text-xs text-vesper-pink" role="alert">
                      {error}
                    </p>
                  )}
                  <TurnstileField resetKey={turnstileKey} onToken={setTurnstileToken} />
                  {fallback && (
                    <div className="flex flex-col gap-3 rounded border border-vesper-accent/30 bg-black/30 p-3">
                      <p className="font-mono text-[11px] text-vesper-accent/70">Respaldo manual</p>
                      <CopyField label="Armored ciphertext" value={fallback.armored} />
                      <CopyField label="Decryption key" value={fallback.passphrase} />
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = fallback.mailtoHref
                        }}
                        className="w-full border border-vesper-accent/50 py-2 font-mono text-xs text-vesper-accent hover:border-vesper-accent"
                      >
                        Open email client
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 w-full border border-vesper-pink py-3 font-mono text-sm text-vesper-pink transition-all hover:bg-vesper-pink/10 hover:shadow-[0_0_24px_rgba(255,42,158,0.35)] disabled:opacity-50"
                  >
                    {busy ? "Encrypting & sending…" : "Encrypt and send"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
