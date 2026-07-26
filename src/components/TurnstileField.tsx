import { useEffect, useRef } from "react"

const SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY

export function turnstileEnabled(): boolean {
  return Boolean(SITE_KEY)
}

type TurnstileFieldProps = {
  onToken: (token: string | null) => void
  /** Bump to re-mount widget after failed submit */
  resetKey: number
}

export function TurnstileField({ onToken, resetKey }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return

    let cancelled = false

    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      onToken(null)
      if (widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        return
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      })
    }

    if (window.turnstile) {
      mount()
    } else {
      let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]")
      if (!script) {
        script = document.createElement("script")
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        script.async = true
        script.defer = true
        script.dataset.turnstile = "true"
        document.head.appendChild(script)
      }
      script.addEventListener("load", mount)
    }

    return () => {
      cancelled = true
      onToken(null)
    }
  }, [resetKey, onToken])

  if (!SITE_KEY) return null

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Bot check" />
}
