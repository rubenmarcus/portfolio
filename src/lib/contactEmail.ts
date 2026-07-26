const ENVELOPE_ID_RE = /^env-[a-f0-9]{8}$/
const AGE_BEGIN = "-----BEGIN AGE ENCRYPTED FILE-----"

export type ContactSendPayload = {
  envelopeId: string
  armored: string
  visitorEmail: string
  subjectLine: string
  honeypot?: string
  turnstileToken?: string
}

const EMAIL_MAX = 254
const CONTROL_CHARS = /[\0-\x1f\x7f]/

function isValidEmail(email: string): boolean {
  if (email.length > EMAIL_MAX) return false
  if (CONTROL_CHARS.test(email)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizeSingleLine(value: string, max: number): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max)
}

export function buildEncryptedEmailContent(params: {
  envelopeId: string
  visitorEmail: string
  subjectLine: string
  armored: string
}): { subject: string; text: string } {
  const subject = `[encrypted][${params.envelopeId}] ${params.subjectLine}`
  const text = [
    `Envelope ID: ${params.envelopeId}`,
    `Reply-To: ${params.visitorEmail}`,
    "",
    "Decrypt locally with age (passphrase sent separately via social DM):",
    "  age -d encrypted.age",
    "",
    params.armored,
  ].join("\n")

  return { subject, text }
}

export function validateContactSubmission(
  body: unknown,
): { ok: true; value: ContactSendPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" }
  }

  const record = body as Record<string, unknown>
  const envelopeId = String(record.envelopeId ?? "").trim()
  const armored = String(record.armored ?? "").trim()
  const visitorEmail = sanitizeSingleLine(String(record.visitorEmail ?? ""), EMAIL_MAX)
  const subjectLine = sanitizeSingleLine(String(record.subjectLine ?? ""), 200)
  const honeypot = String(record.company ?? "").trim()
  const turnstileToken = String(record.turnstileToken ?? "").trim()

  if (!ENVELOPE_ID_RE.test(envelopeId)) {
    return { ok: false, error: "invalid_envelope" }
  }
  if (!armored.includes(AGE_BEGIN) || !armored.includes("-----END AGE ENCRYPTED FILE-----")) {
    return { ok: false, error: "invalid_ciphertext" }
  }
  if (armored.length > 512_000) {
    return { ok: false, error: "ciphertext_too_large" }
  }
  if (!isValidEmail(visitorEmail)) {
    return { ok: false, error: "invalid_email" }
  }
  if (!subjectLine) {
    return { ok: false, error: "invalid_subject" }
  }

  return {
    ok: true,
    value: { envelopeId, armored, visitorEmail, subjectLine, honeypot, turnstileToken },
  }
}
