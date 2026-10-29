begin;
create function public.chant_analytics() returns jsonb language sql stable security definer set search_path=public as $$
 with completed as (select * from chant_sessions where status='completed'),
 daily as (select practice_date,sum(completed_sessions) sessions,sum(total_repetitions) repetitions,sum(total_duration_seconds) seconds,count(*) active_users
 from chant_daily_stats where practice_date >= (now() at time zone 'Asia/Kolkata')::date-29 group by practice_date),
 popular as (select c.id,c.title,count(*) sessions,sum(s.current_count) repetitions from completed s join chants c on c.id=s.chant_id group by c.id,c.title order by count(*) desc limit 10),
 first_practice as (select user_id,min(completed_at) first_at from completed group by user_id),
 languages as (select coalesce(language_code,'original') language,count(*) sessions from completed group by 1)
 select jsonb_build_object(
 'registered_chant_customers',(select count(*) from chant_identities),
 'published_chants',(select count(*) from chants where status='published'),
 'draft_chants',(select count(*) from chants where status='draft'),
 'published_translations',(select count(*) from chant_translations where status='published'),
 'published_audio',(select count(*) from chant_media where status='published' and media_type in ('audio','pronunciation','ambience')),
 'completed_sessions',(select count(*) from completed),
 'total_repetitions',(select coalesce(sum(current_count),0) from completed),
 'practice_minutes',(select coalesce(sum(duration_seconds),0)/60 from completed),
 'daily_active_users',(select count(distinct user_id) from completed where (completed_at at time zone 'Asia/Kolkata')::date=(now() at time zone 'Asia/Kolkata')::date),
 'weekly_active_users',(select count(distinct user_id) from completed where completed_at>=now()-interval '7 days'),
 'new_practitioners_7d',(select count(*) from first_practice where first_at>=now()-interval '7 days'),
 'returning_practitioners_7d',(select count(distinct c.user_id) from completed c join first_practice f using(user_id) where c.completed_at>=now()-interval '7 days' and f.first_at<now()-interval '7 days'),
 'completion_rate',(select round(100.0*count(*) filter(where status='completed')/nullif(count(*),0),1) from chant_sessions where status in ('completed','abandoned')),
 'daily',coalesce((select jsonb_agg(d order by practice_date) from daily d),'[]'::jsonb),
 'popular',coalesce((select jsonb_agg(p) from popular p),'[]'::jsonb),
 'languages',coalesce((select jsonb_agg(l) from languages l),'[]'::jsonb)
 );
$$;
revoke all on function public.chant_analytics() from public,anon,authenticated;
grant execute on function public.chant_analytics() to service_role;
create function public.chant_customer_totals(p_user uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('repetitions',coalesce(sum(current_count),0),'sessions',count(*)) from chant_sessions where user_id=p_user and status='completed';
$$;
revoke all on function public.chant_customer_totals(uuid) from public,anon,authenticated;
grant execute on function public.chant_customer_totals(uuid) to service_role;
commit;
