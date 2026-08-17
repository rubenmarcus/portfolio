import { EMAIL } from "../resume";
import { sbInsert } from "./supabase";

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  contact: string;
  brief: string;
  budget?: string;
  agent: string;
  attribution?: Record<string, string>;
}

export interface DeliveryResult {
  ok: boolean;
  leadId: string;
  deliveredTo: string[];
}

export const deliverLead = async (lead: Lead): Promise<DeliveryResult> => {
  const deliveredTo: string[] = [];
  const webhookUrl = import.meta.env.LEADS_WEBHOOK_URL?.trim();
  const webhookToken = import.meta.env.LEADS_WEBHOOK_TOKEN?.trim();

  const mail = fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      _subject: `[portfolio lead ${lead.id}] ${lead.name} via ${lead.agent}`,
      lead_id: lead.id,
      created_at: lead.createdAt,
      name: lead.name,
      contact: lead.contact,
      brief: lead.brief,
      budget: lead.budget || "not specified",
      agent: lead.agent,
      attribution: JSON.stringify(lead.attribution ?? {}),
    }),
  }).then((response) => {
    if (response.ok) deliveredTo.push("email");
  }).catch(() => undefined);

  const webhook = webhookUrl
    ? fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(webhookToken ? { authorization: `Bearer ${webhookToken}` } : {}),
        },
        body: JSON.stringify(lead),
      }).then((response) => {
        if (response.ok) deliveredTo.push("webhook");
      }).catch(() => undefined)
    : Promise.resolve();

  await Promise.all([mail, webhook]);

  // Durable mirror: every lead also lands in Supabase (public.leads), so a
  // formsubmit hiccup can no longer lose one. Counts as a delivery — the
  // lead is captured and queryable even if the email bounced.
  const stored = await sbInsert("leads", {
    id: lead.id,
    created_at: lead.createdAt,
    name: lead.name,
    contact: lead.contact,
    brief: lead.brief,
    budget: lead.budget || null,
    agent: lead.agent,
    attribution: lead.attribution ?? {},
    delivered_to: deliveredTo,
  });
  if (stored) deliveredTo.push("supabase");

  return { ok: deliveredTo.length > 0, leadId: lead.id, deliveredTo };
};
