import { Encrypter, armor } from "age-encryption"
import { buildEncryptedEmailContent } from "./contactEmail"

export type ContactPayload = {
  version: 1
  envelopeId: string
  sentAt: string
  contextRole: string
  name: string
  email: string
  subject: string
  message: string
}

const PASSPHRASE_BYTES = 24

export function createEnvelopeId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `env-${hex}`
}

export function createDecryptionPassphrase(): string {
  const bytes = new Uint8Array(PASSPHRASE_BYTES)
  crypto.getRandomValues(bytes)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export async function encryptContactPayload(
  payload: ContactPayload,
  passphrase: string,
): Promise<string> {
  const encrypter = new Encrypter()
  encrypter.setPassphrase(passphrase)
  const ciphertext = await encrypter.encrypt(JSON.stringify(payload))
  return armor.encode(ciphertext)
}

/** Safe upper bound for mailto URLs across common clients */
export const MAILTO_MAX_URL_LENGTH = 6_000

export function buildEncryptedMailto(params: {
  to: string
  envelopeId: string
  visitorEmail: string
  subjectLine: string
  armored: string
}): { href: string; truncated: boolean } {
  const { subject, text } = buildEncryptedEmailContent({
    envelopeId: params.envelopeId,
    visitorEmail: params.visitorEmail,
    subjectLine: params.subjectLine,
    armored: params.armored,
  })

  const href = `mailto:${params.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`

  if (href.length <= MAILTO_MAX_URL_LENGTH) {
    return { href, truncated: false }
  }

  const shortBody = [
    `Envelope ID: ${params.envelopeId}`,
    `Reply-To: ${params.visitorEmail}`,
    "",
    "The armored ciphertext is on the jseramn.tech success screen — paste it below this line.",
    "",
    "(Paste -----BEGIN AGE ENCRYPTED FILE----- block here)",
  ].join("\n")

  const shortHref = `mailto:${params.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`
  return { href: shortHref, truncated: true }
}
