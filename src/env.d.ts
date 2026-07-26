/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY?: string
  readonly TURNSTILE_SECRET_KEY?: string
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
  readonly UPSTASH_REDIS_REST_URL?: string
  readonly UPSTASH_REDIS_REST_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string
        theme?: "light" | "dark" | "auto"
        callback?: (token: string) => void
        "expired-callback"?: () => void
        "error-callback"?: () => void
      },
    ) => string
    reset: (widgetId: string) => void
  }
}
