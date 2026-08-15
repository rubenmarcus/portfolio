import { track } from "@vercel/analytics/server";

/**
 * Usage counters for the MCP endpoint.
 *
 * The endpoint had no instrumentation at all: the only trace of an agent
 * connecting was a Vercel function log, which does not retain long enough to
 * answer "has agent traffic shown up yet". That question was asked in public
 * and could not be answered. This records enough to answer it.
 *
 * Deliberately reuses @vercel/analytics, already a dependency and already used
 * client-side, instead of adding a store. Server-side custom events are
 * plan-limited, so treat these as directional counts, not billing-grade.
 *
 * Never throws and never delays the response: a metric must not be able to
 * break a tool call.
 */

export type McpEvent = {
  /** JSON-RPC method: initialize, tools/list, tools/call, ping. */
  method: string;
  /** Tool name, for tools/call only. */
  tool?: string;
  /** clientInfo.name from initialize — which agent is on the other end. */
  client?: string;
  /** Set when the call was rejected, so failures are visible separately. */
  outcome?: "ok" | "error";
};

export const recordMcpCall = (event: McpEvent): void => {
  try {
    const props: Record<string, string> = { method: event.method };
    if (event.tool) props.tool = event.tool;
    if (event.client) props.client = event.client.slice(0, 80);
    if (event.outcome) props.outcome = event.outcome;

    // Not awaited: the response should not wait on the analytics round trip.
    void track("mcp_call", props).catch(() => {});
  } catch {
    // Metrics are best effort. A failure here is never worth a 500.
  }
};
