-- EduVision Academy - phone numbers, course catalogue, enrollment requests
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- ─────────────────────────────────────────────────────────────
-- Phone number on profiles (collected at sign-up)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists phone text not null default '';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Prices: null = not set yet (never treated as free), 0 = free course
-- ─────────────────────────────────────────────────────────────
alter table public.courses alter column price drop not null;
alter table public.courses alter column price drop default;
alter table public.courses alter column currency set default 'RWF';

insert into public.courses (slug, title, description, language, level, price, currency, published) values
  ('english', 'English', 'Speak fluently, write confidently, and prepare for IELTS, TOEFL & Duolingo.', 'English', 'All levels', null, 'RWF', true),
  ('french', 'French', 'Build everyday French for work, travel and study, from first words to real conversations.', 'French', 'All levels', null, 'RWF', true),
  ('swahili', 'Swahili', 'Connect across East Africa with practical, spoken Swahili for daily life and business.', 'Swahili', 'All levels', null, 'RWF', true),
  ('chinese', 'Chinese', 'Start Mandarin from zero: pronunciation, characters and confident conversation.', 'Chinese', 'Beginner', null, 'RWF', true),
  ('photography-videography', 'Photography & Videography', 'Master camera handling, lighting, shot types and creative photo & video editing.', '', 'All levels', null, 'RWF', true),
  ('traffic-rules', 'Traffic Rules & Road Safety', 'Learn road signs and driving theory, and get ready to pass your provisional test.', '', 'All levels', null, 'RWF', true)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Students request enrollment; it stays 'pending' until payment
-- (an admin, or later the payment provider, sets it to 'active').
-- Free courses (price = 0) are activated immediately.
-- ─────────────────────────────────────────────────────────────
create or replace function public.request_enrollment(p_course_id uuid)
returns enrollments language plpgsql security definer set search_path = public as $$
declare
  v_course  courses;
  v_row     enrollments;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  select * into v_course from courses where id = p_course_id and published;
  if not found then raise exception 'Course not found'; end if;

  insert into enrollments (user_id, course_id, status)
  values (auth.uid(), p_course_id, case when v_course.price = 0 then 'active' else 'pending' end)
  on conflict (user_id, course_id) do update
    -- A cancelled request can be re-opened; active/pending stay as they are
    set status = case when enrollments.status = 'cancelled' then excluded.status else enrollments.status end
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.request_enrollment(uuid) from public, anon;
grant execute on function public.request_enrollment(uuid) to authenticated;
