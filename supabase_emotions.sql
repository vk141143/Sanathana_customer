-- ─────────────────────────────────────────────
-- EMOTIONS TABLE
-- ─────────────────────────────────────────────
create table if not exists public.emotions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,                  -- e.g. "Anger"
  tagline         text,                           -- e.g. "Transform Your Energy"
  card_image_url  text,                           -- image shown on the grid card in Explore
  banner_image_url text,                          -- banner shown INSIDE the detail page (top hero)
  outside_image_url text,                         -- image shown OUTSIDE / on the card in the list

  -- Bhagavad Gita section
  gita_sanskrit   text,
  gita_reference  text,
  gita_transliteration text,
  gita_translation text,
  gita_image_url  text,                           -- optional image beside the shloka

  -- What it means section
  what_it_means   text,
  means_image_url text,                           -- optional

  -- Example section
  example_text    text,
  example_image_url text,                         -- optional

  -- How to overcome (stored as JSON array of {title, sub})
  how_to_overcome jsonb default '[]'::jsonb,

  -- Mantra section
  mantra_sanskrit text,
  mantra_transliteration text,
  mantra_meaning  text,
  mantra_image_url text,                          -- optional

  is_active       boolean default true,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET: emotions
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('emotions', 'emotions', true)
on conflict (id) do nothing;

-- Public read
create policy "emotions_public_read"
  on storage.objects for select
  using (bucket_id = 'emotions');

-- Anon upload
create policy "emotions_anon_upload"
  on storage.objects for insert
  with check (bucket_id = 'emotions');

-- Anon delete
create policy "emotions_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'emotions');

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.emotions enable row level security;

create policy "emotions_anon_select"
  on public.emotions for select using (true);

create policy "emotions_anon_insert"
  on public.emotions for insert with check (true);

create policy "emotions_anon_update"
  on public.emotions for update using (true);

create policy "emotions_anon_delete"
  on public.emotions for delete using (true);
