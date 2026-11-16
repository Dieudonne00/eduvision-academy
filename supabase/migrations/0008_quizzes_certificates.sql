-- EduVision Academy - quizzes after chapters, final exam, certificates
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

-- A quiz sits after a chapter (after_lesson_id); a final exam (kind = 'exam') sits at the end.
alter table public.quizzes add column if not exists after_lesson_id uuid references public.lessons(id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- Certificates (issued automatically when a student passes the final exam)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.certificates (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  attempt_id    uuid references public.quiz_attempts(id) on delete set null,
  full_name     text not null,
  course_title  text not null,
  score         numeric(5, 2) not null,
  issued_at     timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.certificates enable row level security;
drop policy if exists "read own certificates or admin" on public.certificates;
create policy "read own certificates or admin" on public.certificates
  for select using (user_id = auth.uid() or is_admin());

-- Public verification by code (shows only what is printed on the certificate)
create or replace function public.get_certificate(p_code text)
returns table (code text, full_name text, course_title text, score numeric, issued_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.code, c.full_name, c.course_title, c.score, c.issued_at
  from certificates c where c.code = upper(btrim(p_code));
$$;
grant execute on function public.get_certificate(text) to anon, authenticated;

-- Has the signed-in student completed every chapter of the course?
create or replace function public.course_completed(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from lessons l join modules m on m.id = l.module_id
    where m.course_id = p_course_id
      and not exists (select 1 from lesson_progress p where p.lesson_id = l.id and p.user_id = auth.uid())
  );
$$;
grant execute on function public.course_completed(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Start (or resume) an attempt; the final exam needs every chapter completed
-- ─────────────────────────────────────────────────────────────
create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_quiz     quizzes;
  v_open     quiz_attempts;
  v_used     int;
  v_ids      uuid[];
  v_id       uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  select * into v_quiz from quizzes where id = p_quiz_id;
  if not found or not (v_quiz.published or is_admin()) then raise exception 'Quiz not found'; end if;
  if not (is_enrolled(v_quiz.course_id) or is_admin()) then raise exception 'You are not enrolled in this course'; end if;
  if v_quiz.kind = 'exam' and not is_admin() and not course_completed(v_quiz.course_id) then
    raise exception 'Complete every chapter to unlock the final exam.';
  end if;

  -- Resume an unfinished attempt that is still within its time limit
  select * into v_open from quiz_attempts
  where quiz_id = p_quiz_id and user_id = auth.uid() and submitted_at is null
  order by started_at desc limit 1;
  if found and (v_quiz.time_limit_minutes is null
                or now() < v_open.started_at + make_interval(mins => v_quiz.time_limit_minutes)) then
    return v_open.id;
  end if;

  select count(*) into v_used from quiz_attempts where quiz_id = p_quiz_id and user_id = auth.uid();
  if v_quiz.max_attempts is not null and v_used >= v_quiz.max_attempts then
    raise exception 'No attempts left (% of % used)', v_used, v_quiz.max_attempts;
  end if;

  if v_quiz.shuffle or v_quiz.question_count is not null then
    select array_agg(id) into v_ids from (
      select id from questions where quiz_id = p_quiz_id order by random() limit v_quiz.question_count
    ) s;
  else
    select array_agg(id order by position) into v_ids from questions where quiz_id = p_quiz_id;
  end if;
  if v_ids is null then raise exception 'This quiz has no questions yet'; end if;

  insert into quiz_attempts (quiz_id, user_id, question_ids) values (p_quiz_id, auth.uid(), v_ids)
  returning id into v_id;
  return v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Submit and mark; passing the final exam issues the certificate
-- ─────────────────────────────────────────────────────────────
create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answers jsonb)
returns quiz_attempts language plpgsql security definer set search_path = public as $$
declare
  v_attempt  quiz_attempts;
  v_quiz     quizzes;
  v_answers  jsonb := coalesce(p_answers, '{}'::jsonb);
  v_results  jsonb := '[]'::jsonb;
  v_score    numeric := 0;
  v_max      numeric := 0;
  v_earned   numeric;
  r          record;
begin
  select * into v_attempt from quiz_attempts where id = p_attempt_id for update;
  if not found or v_attempt.user_id <> auth.uid() then raise exception 'Attempt not found'; end if;
  if v_attempt.submitted_at is not null then return v_attempt; end if;

  select * into v_quiz from quizzes where id = v_attempt.quiz_id;

  -- Answers sent well after the time limit don't count (2 minute grace for slow connections)
  if v_quiz.time_limit_minutes is not null
     and now() > v_attempt.started_at + make_interval(mins => v_quiz.time_limit_minutes + 2) then
    v_answers := '{}'::jsonb;
  end if;

  for r in
    select q.id, q.type, q.points, k.answer, k.explanation, ord
    from unnest(v_attempt.question_ids) with ordinality as u(qid, ord)
    join questions q on q.id = u.qid
    join question_keys k on k.question_id = q.id
    order by ord
  loop
    v_earned := grade_question(r.type, r.points, r.answer, v_answers->(r.id::text));
    v_score  := v_score + v_earned;
    v_max    := v_max + r.points;
    v_results := v_results || jsonb_build_object(
      'question_id', r.id,
      'given',       v_answers->(r.id::text),
      'correct_answer', r.answer,
      'explanation', r.explanation,
      'points',      r.points,
      'earned',      v_earned,
      'correct',     v_earned = r.points
    );
  end loop;

  update quiz_attempts set
    submitted_at = now(),
    answers  = v_answers,
    results  = v_results,
    score    = v_score,
    max_score = v_max,
    percent  = case when v_max > 0 then round(100 * v_score / v_max, 2) else 0 end,
    passed   = case when v_max > 0 then (100 * v_score / v_max) >= v_quiz.pass_mark else false end
  where id = p_attempt_id
  returning * into v_attempt;

  if v_quiz.kind = 'exam' and v_attempt.passed then
    insert into certificates (user_id, course_id, attempt_id, full_name, course_title, score)
    select v_attempt.user_id, v_quiz.course_id, v_attempt.id,
           coalesce(nullif(p.full_name, ''), p.email), c.title, v_attempt.percent
    from profiles p, courses c
    where p.id = v_attempt.user_id and c.id = v_quiz.course_id
    on conflict (user_id, course_id) do nothing;
  end if;

  return v_attempt;
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
