-- Additive migration. Run once through the migration runner, inside a transaction.
begin;
create table public.chant_identities (
 id uuid primary key default gen_random_uuid(), firebase_uid text not null unique,
 created_at timestamptz not null default now()
);
-- Explicit, operator-provisioned bindings. Never infer admin authority from an email.
create table public.chant_admin_bindings (
 firebase_uid text primary key, admin_id uuid not null references public.admin_users(id)
);
create table public.chant_categories (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), slug text not null unique,
 description text, icon_url text, cover_image_url text, sort_order integer not null default 0,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid references public.admin_users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.chants (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null check(length(trim(title))>0), short_description text,
 category_id uuid references public.chant_categories(id), mantra_type text not null default 'mantra' check(mantra_type in ('mantra','nama_japa','stotram')),
 original_text text, transliteration text, pronunciation_guide text, source_title text, source_reference text, copyright_status text, rights_notes text,
 default_repetition_target integer not null default 108 check(default_repetition_target between 1 and 1000000),
 available_targets integer[] not null default '{11,27,54,108}' check(cardinality(available_targets)>0 and 0 < all(available_targets) and 1000000 >= all(available_targets) and array_position(available_targets,null) is null),
 is_beginner_friendly boolean not null default false, sort_order integer not null default 0, featured boolean not null default false,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 cover_image_url text, cover_image_r2_key text, created_by uuid references public.admin_users(id), updated_by uuid references public.admin_users(id),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status <> 'published' or (length(trim(original_text))>0 and original_text is not null and length(trim(source_title))>0 and source_title is not null and copyright_status is not null and length(trim(copyright_status))>0))
);
create table public.chant_translations (
 id uuid primary key default gen_random_uuid(), chant_id uuid not null references public.chants(id) on delete cascade,
 language_code text not null check(language_code in ('te','hi','en','kn','ta','ml')), display_title text, transliteration text, pronunciation_guide text,
 meaning text, explanation text, life_context text, status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid references public.admin_users(id), updated_by uuid references public.admin_users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(chant_id,language_code),
 check(status <> 'published' or (meaning is not null and length(trim(meaning))>0))
);
create table public.chant_media (
 id uuid primary key default gen_random_uuid(), chant_id uuid not null references public.chants(id) on delete cascade,
 media_type text not null check(media_type in ('audio','pronunciation','artwork','ambience')),
 language_code text check(language_code in ('te','hi','en','kn','ta','ml')), title text,
 storage_provider text not null default 'cloudflare_r2', storage_key text not null, public_url text not null,
 duration_seconds integer check(duration_seconds>=0), mime_type text not null, file_size_bytes bigint not null check(file_size_bytes between 1 and 26214400),
 is_default boolean not null default false, status text not null default 'draft' check(status in ('draft','published','archived')),
 display_order integer not null default 0, created_by uuid references public.admin_users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index chant_media_default on public.chant_media(chant_id,media_type,coalesce(language_code,'')) where is_default and status='published';
create table public.user_chant_favourites (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.chant_identities(id),
 chant_id uuid not null references public.chants(id), created_at timestamptz not null default now(), unique(user_id,chant_id)
);
create table public.chant_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.chant_identities(id), chant_id uuid not null references public.chants(id),
 status text not null default 'active' check(status in ('active','paused','completed','abandoned')), counting_mode text not null default 'manual' check(counting_mode='manual'),
 language_code text check(language_code in ('te','hi','en','kn','ta','ml')),
 target_count integer not null check(target_count between 1 and 1000000), current_count integer not null default 0 check(current_count between 0 and 10000000),
 completed_malas integer generated always as (current_count / 108) stored,
 started_at timestamptz not null default now(), last_activity_at timestamptz not null default now(), paused_at timestamptz, completed_at timestamptz,
 duration_seconds integer not null default 0 check(duration_seconds>=0), active_milliseconds bigint not null default 0 check(active_milliseconds>=0), reflection text check(length(reflection)<=2000),
 client_session_key uuid not null, version integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,client_session_key), check((status='completed')=(completed_at is not null))
);
create index chant_session_history on public.chant_sessions(user_id,started_at desc);
create index chant_session_completed on public.chant_sessions(completed_at,chant_id) where status='completed';
create index chant_discovery on public.chants(status,category_id,sort_order);
create index chant_category_order on public.chant_categories(status,sort_order);
create index chant_media_parent on public.chant_media(chant_id,status);
-- Derived, never client-written; all dates use Asia/Kolkata.
create view public.chant_daily_stats with (security_invoker=true) as
 select user_id,(completed_at at time zone 'Asia/Kolkata')::date practice_date,
 count(*) completed_sessions,sum(current_count) total_repetitions,sum(duration_seconds) total_duration_seconds
 from public.chant_sessions where status='completed' group by 1,2;

create function public.chant_touch() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['chant_categories','chants','chant_translations','chant_media','chant_sessions'] loop
 execute format('create trigger chant_updated before update on public.%I for each row execute function public.chant_touch()',t);
 end loop;
 foreach t in array array['chant_identities','chant_admin_bindings','chant_categories','chants','chant_translations','chant_media','user_chant_favourites','chant_sessions'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.chant_categories,public.chants,public.chant_translations,public.chant_media to anon,authenticated;
revoke all on public.chant_daily_stats from anon,authenticated;
grant select on public.chant_daily_stats to service_role;
create policy published_categories on public.chant_categories for select to anon,authenticated using(status='published');
create policy published_chants on public.chants for select to anon,authenticated using(status='published' and (category_id is null or exists(select 1 from public.chant_categories c where c.id=category_id and c.status='published')));
create policy published_translations on public.chant_translations for select to anon,authenticated using(status='published' and exists(select 1 from public.chants c where c.id=chant_id));
create policy published_media on public.chant_media for select to anon,authenticated using(status='published' and exists(select 1 from public.chants c where c.id=chant_id));

-- Server only: row lock + expected version prevents races and replayed taps.
create function public.chant_session_action(p_user uuid,p_session uuid,p_action text,p_version integer,p_reflection text default null)
returns public.chant_sessions language plpgsql security definer set search_path=public as $$
declare s public.chant_sessions; elapsed integer;
begin
 select * into s from public.chant_sessions where id=p_session and user_id=p_user for update;
 if not found then raise exception 'Session not found'; end if;
 if s.status='completed' and p_action='complete' then return s; end if;
 if s.version<>p_version then raise exception 'Session changed; reload before retrying'; end if;
 if s.status in ('completed','abandoned') then raise exception 'Session is closed'; end if;
 if p_action not in ('tap','undo','pause','resume','complete','abandon','heartbeat') then raise exception 'Invalid action'; end if;
 if p_action in ('tap','undo','heartbeat','pause') and s.status<>'active' then raise exception 'Resume first'; end if;
 if p_action='resume' and s.status<>'paused' then raise exception 'Session is not paused'; end if;
 if p_action='complete' and s.current_count=0 then raise exception 'Count at least one repetition'; end if;
 -- Heartbeats every 15s; cap unattended time at 30s per request. Paused time never counts.
 elapsed=case when s.status='active' then least(30000,greatest(0,floor(extract(epoch from now()-s.last_activity_at)*1000)::integer)) else 0 end;
 update public.chant_sessions set
 current_count=case p_action when 'tap' then current_count+1 when 'undo' then greatest(0,current_count-1) else current_count end,
 status=case p_action when 'pause' then 'paused' when 'resume' then 'active' when 'complete' then 'completed' when 'abandon' then 'abandoned' else status end,
 paused_at=case when p_action='pause' then now() when p_action='resume' then null else paused_at end,
 completed_at=case when p_action='complete' then now() else null end,
 reflection=case when p_action='complete' then p_reflection else reflection end,
 active_milliseconds=active_milliseconds+elapsed,duration_seconds=(active_milliseconds+elapsed)/1000,last_activity_at=now(),version=version+1
 where id=s.id returning * into s;
 return s;
end $$;
revoke all on function public.chant_session_action(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.chant_session_action(uuid,uuid,text,integer,text) to service_role;

insert into public.chant_categories(name,slug) select name,lower(name) from unnest(array['Krishna','Vishnu','Shiva','Rama','Hanuman','Ganesha','Devi','Lakshmi','Saraswati','General']) name on conflict(slug) do nothing;
commit;
