/**
 * Server-only Supabase PostgREST helper. Plain fetch, no SDK: the client
 * bundle never sees Supabase, no anon key exists, and RLS stays closed —
 * everything goes through the service role key, which lives exclusively
 * in server env vars (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Everything degrades gracefully without the env vars, like the rest of
 * the site: helpers report "disabled" instead of throwing.
 */

const url = () => (import.meta.env.SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const key = () => import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export const supabaseEnabled = () => Boolean(url() && key());

const headers = () => ({
  apikey: key()!,
  authorization: `Bearer ${key()!}`,
  "content-type": "application/json",
});

/** Call a Postgres function. Returns its JSON result, or null on any failure. */
export const sbRpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T | null> => {
  if (!supabaseEnabled()) return null;
  try {
    const res = await fetch(`${url()}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

/** Read rows. Returns [] on any failure. */
export const sbSelect = async <T>(table: string, query: string): Promise<T[]> => {
  if (!supabaseEnabled()) return [];
  try {
    const res = await fetch(`${url()}/rest/v1/${table}?${query}`, { headers: headers() });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
};

/**
 * Insert one row. Never throws; resolves to whether the write landed.
 * Metrics callers fire-and-forget (void / waitUntil); leads.ts awaits the
 * boolean to count the mirror as a delivery destination.
 */
export const sbInsert = (table: string, row: Record<string, unknown>): Promise<boolean> => {
  if (!supabaseEnabled()) return Promise.resolve(false);
  return fetch(`${url()}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers(), prefer: "return=minimal" },
    body: JSON.stringify(row),
  })
    .then((res) => res.ok)
    .catch(() => false);
};
