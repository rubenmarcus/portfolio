-- Observability schema for rubenmarcus.dev — run once in the Supabase SQL
-- editor (idempotent: safe to re-run).
--
-- Access model: the site talks to PostgREST exclusively with the service
-- role key, server-side (src/lib/server/supabase.ts). RLS is enabled with
-- NO policies and function execution is revoked from anon/authenticated,
-- so the anon key can neither read nor write anything.

-- 1. Per-post view counter (slug = translation key, EN+PT share a row).
create table if not exists public.page_views (
  slug       text primary key,
  views      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. Per-post likes.
create table if not exists public.post_likes (
  slug       text primary key,
  likes      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 3. MCP endpoint events — which agents connect and what they call.
create table if not exists public.mcp_events (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  method  text not null,
  tool    text,
  client  text,
  outcome text
);
create index if not exists mcp_events_at_idx on public.mcp_events (at desc);

-- 4. Agent-surface hits — terminal resume, resume endpoints, markdown
--    twins, .well-known discovery. (llms.txt is static and cannot log.)
create table if not exists public.agent_hits (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  surface    text not null,
  path       text not null,
  user_agent text
);
create index if not exists agent_hits_at_idx on public.agent_hits (at desc);
create index if not exists agent_hits_surface_idx on public.agent_hits (surface);

-- 5. Lead mirror — every book_intro / hire lead also lands here, so lead
--    history stops depending on the email relay alone.
create table if not exists public.leads (
  id           uuid primary key,
  created_at   timestamptz not null default now(),
  name         text not null,
  contact      text not null,
  brief        text not null,
  budget       text,
  agent        text,
  attribution  jsonb,
  delivered_to text[]
);

-- Atomic counters ------------------------------------------------------

create or replace function public.increment_view(page_slug text)
returns bigint language plpgsql as $$
declare new_views bigint;
begin
  insert into public.page_views (slug, views) values (page_slug, 1)
  on conflict (slug) do update
    set views = page_views.views + 1, updated_at = now()
  returning views into new_views;
  return new_views;
end $$;

create or replace function public.increment_like(page_slug text, delta bigint default 1)
returns bigint language plpgsql as $$
declare new_likes bigint;
begin
  insert into public.post_likes (slug, likes) values (page_slug, greatest(delta, 0))
  on conflict (slug) do update
    set likes = greatest(post_likes.likes + delta, 0), updated_at = now()
  returning likes into new_likes;
  return new_likes;
end $$;

-- One aggregate for GET /api/stats -------------------------------------

create or replace function public.get_stats()
returns jsonb language sql stable as $$
  with recent_agents as (
    select distinct on (client) client, coalesce(tool, method) as last_call, at
    from public.mcp_events
    where client is not null
    order by client, at desc
  )
  select jsonb_build_object(
    'views_total',   coalesce((select sum(views) from public.page_views), 0),
    'likes_total',   coalesce((select sum(likes) from public.post_likes), 0),
    'mcp_events_total', (select count(*) from public.mcp_events),
    'mcp_events_7d', (select count(*) from public.mcp_events where at > now() - interval '7 days'),
    'mcp_tool_calls', coalesce((select jsonb_object_agg(tool, n)
      from (select tool, count(*) n from public.mcp_events where tool is not null group by tool) t), '{}'::jsonb),
    'mcp_clients', coalesce((select jsonb_object_agg(client, n)
      from (select client, count(*) n from public.mcp_events where client is not null group by client) c), '{}'::jsonb),
    'agent_hits_total', (select count(*) from public.agent_hits),
    'agent_hits_by_surface', coalesce((select jsonb_object_agg(surface, n)
      from (select surface, count(*) n from public.agent_hits group by surface) s), '{}'::jsonb),
    'leads_total', (select count(*) from public.leads),
    'top_posts', coalesce((select jsonb_agg(jsonb_build_object('slug', slug, 'views', views))
      from (select slug, views from public.page_views order by views desc limit 10) p), '[]'::jsonb),
    'recent_agents', coalesce((select jsonb_agg(jsonb_build_object('client', a.client, 'call', a.last_call, 'at', a.at))
      from (select * from recent_agents order by at desc limit 5) a), '[]'::jsonb)
  )
$$;

-- Lock everything down for anon ----------------------------------------

alter table public.page_views enable row level security;
alter table public.post_likes enable row level security;
alter table public.mcp_events enable row level security;
alter table public.agent_hits enable row level security;
alter table public.leads      enable row level security;

revoke execute on function public.increment_view(text)         from anon, authenticated;
revoke execute on function public.increment_like(text, bigint) from anon, authenticated;
revoke execute on function public.get_stats()                  from anon, authenticated;
