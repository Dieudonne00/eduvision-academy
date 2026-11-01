-- EduVision Academy - initial schema
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Security model:
--   * Course outlines (titles, lesson names) are public once published.
--   * Lesson media (YouTube IDs, audio paths) and quiz questions are only
--     readable by enrolled students (or preview lessons) and admins.
--   * Correct answers live in question_keys, which students can never read.
--     Marking happens inside submit_quiz_attempt() on the database server.

-- ─────────────────────────────────────────────────────────────
-- Profiles (one per auth user)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students cannot promote themselves to admin
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() and auth.uid() is not null then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ─────────────────────────────────────────────────────────────
-- Courses, modules, lessons
-- ─────────────────────────────────────────────────────────────
create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  language     text not null default '',
  level        text not null default '',
  price        numeric(12, 2) not null default 0,
  currency     text not null default 'USD',
  cover_url    text,
  published    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  position   int not null default 0
);
create index on public.modules (course_id, position);

create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules(id) on delete cascade,
  title             text not null,
  kind              text not null check (kind in ('video', 'audio')),
  duration_seconds  int,
  is_preview        boolean not null default false,
  position          int not null default 0
);
create index on public.lessons (module_id, position);

-- Kept separate from lessons so the outline can be public while media stays locked
create table public.lesson_media (
  lesson_id   uuid primary key references public.lessons(id) on delete cascade,
  youtube_id  text,
  audio_path  text,
  check ((youtube_id is not null) or (audio_path is not null))
);

-- ─────────────────────────────────────────────────────────────
-- Enrollments & progress
-- ─────────────────────────────────────────────────────────────
create table public.enrollments (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  status      text not null default 'active' check (status in ('pending', 'active', 'cancelled')),
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  primary key (user_id, course_id)
);

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments
    where user_id = auth.uid() and course_id = p_course_id and status = 'active'
  );
$$;

create table public.lesson_progress (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ─────────────────────────────────────────────────────────────
-- Quizzes & exams
-- ─────────────────────────────────────────────────────────────
create table public.quizzes (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  module_id           uuid references public.modules(id) on delete cascade, -- null = course-level (final exam)
  title               text not null,
  kind                text not null default 'quiz' check (kind in ('quiz', 'exam')),
  pass_mark           int not null default 70 check (pass_mark between 0 and 100),
  time_limit_minutes  int check (time_limit_minutes > 0),
  max_attempts        int check (max_attempts > 0),   -- null = unlimited
  question_count      int check (question_count > 0), -- null = all questions; otherwise random pick from the bank
  shuffle             boolean not null default true,
  published           boolean not null default false,
  position            int not null default 0
);
create index on public.quizzes (course_id, position);

-- options (what students see):
--   single / multiple / true_false: {"choices": [{"id": "a", "text": "Hello"}, ...]}
--   fill_blank:                     {}
--   matching:                       {"left": [{"id","text"}], "right": [{"id","text"}]}
create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  type         text not null check (type in ('single', 'multiple', 'true_false', 'fill_blank', 'matching')),
  prompt       text not null,
  audio_path   text,
  options      jsonb not null default '{}'::jsonb,
  points       numeric(6, 2) not null default 1 check (points > 0),
  position     int not null default 0
);
create index on public.questions (quiz_id, position);

-- answer (never visible to students):
--   single / true_false: {"correct": "a"}
--   multiple:            {"correct": ["a", "c"]}
--   fill_blank:          {"accepted": ["suis", "je suis"]}
--   matching:            {"pairs": {"l1": "r3", "l2": "r1"}}
create table public.question_keys (
  question_id  uuid primary key references public.questions(id) on delete cascade,
  answer       jsonb not null,
  explanation  text not null default ''
);

create table public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  question_ids  uuid[] not null,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  answers       jsonb,
  results       jsonb,
  score         numeric(8, 2),
  max_score     numeric(8, 2),
  percent       numeric(5, 2),
  passed        boolean
);
create index on public.quiz_attempts (user_id, quiz_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.lesson_media    enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes         enable row level security;
alter table public.questions       enable row level security;
alter table public.question_keys   enable row level security;
alter table public.quiz_attempts   enable row level security;

-- profiles
create policy "read own profile or admin" on public.profiles
  for select using (id = auth.uid() or is_admin());
create policy "update own profile or admin" on public.profiles
  for update using (id = auth.uid() or is_admin());

-- courses / modules / lessons: public outline when published, admins manage
create policy "read published courses" on public.courses
  for select using (published or is_admin());
create policy "admins manage courses" on public.courses
  for all using (is_admin()) with check (is_admin());

create policy "read modules of published courses" on public.modules
  for select using (exists (select 1 from courses c where c.id = course_id and (c.published or is_admin())));
create policy "admins manage modules" on public.modules
  for all using (is_admin()) with check (is_admin());

create policy "read lessons of published courses" on public.lessons
  for select using (exists (
    select 1 from modules m join courses c on c.id = m.course_id
    where m.id = module_id and (c.published or is_admin())));
create policy "admins manage lessons" on public.lessons
  for all using (is_admin()) with check (is_admin());

-- lesson media: enrolled students, preview lessons, or admins
create policy "read media if enrolled or preview" on public.lesson_media
  for select using (
    is_admin() or exists (
      select 1 from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id
      where l.id = lesson_id and c.published and (l.is_preview or is_enrolled(c.id))));
create policy "admins manage media" on public.lesson_media
  for all using (is_admin()) with check (is_admin());

-- enrollments: students read their own; only admins (later: payment webhook) create them
create policy "read own enrollments" on public.enrollments
  for select using (user_id = auth.uid() or is_admin());
create policy "admins manage enrollments" on public.enrollments
  for all using (is_admin()) with check (is_admin());

-- lesson progress: students manage their own for courses they're enrolled in
create policy "read own progress" on public.lesson_progress
  for select using (user_id = auth.uid() or is_admin());
create policy "mark own progress" on public.lesson_progress
  for insert with check (
    user_id = auth.uid() and exists (
      select 1 from lessons l join modules m on m.id = l.module_id
      where l.id = lesson_id and is_enrolled(m.course_id)));
create policy "remove own progress" on public.lesson_progress
  for delete using (user_id = auth.uid());

-- quizzes: visible in published courses; questions only to enrolled students
create policy "read published quizzes" on public.quizzes
  for select using (is_admin() or (published and exists (select 1 from courses c where c.id = course_id and c.published)));
create policy "admins manage quizzes" on public.quizzes
  for all using (is_admin()) with check (is_admin());

create policy "read questions if enrolled" on public.questions
  for select using (
    is_admin() or exists (
      select 1 from quizzes q where q.id = quiz_id and q.published and is_enrolled(q.course_id)));
create policy "admins manage questions" on public.questions
  for all using (is_admin()) with check (is_admin());

-- answer keys: admins only
create policy "admins manage answer keys" on public.question_keys
  for all using (is_admin()) with check (is_admin());

-- attempts: read own; created/submitted only through the functions below
create policy "read own attempts" on public.quiz_attempts
  for select using (user_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────────────────────
-- Quiz engine
-- ─────────────────────────────────────────────────────────────

-- Start (or resume) an attempt. Returns the attempt id.
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

-- Normalise a typed answer: lowercase, trimmed, single spaces
create or replace function public.normalize_answer(t text)
returns text language sql immutable as $$
  select lower(regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g'));
$$;

-- Mark one question. Returns the earned points (0..points).
create or replace function public.grade_question(p_type text, p_points numeric, p_key jsonb, p_given jsonb)
returns numeric language plpgsql immutable as $$
declare
  v_correct   jsonb;
  v_n         int;
  v_right     int;
  v_wrong     int;
begin
  if p_given is null or p_given = 'null'::jsonb then return 0; end if;

  case p_type
    when 'single', 'true_false' then
      return case when p_given = p_key->'correct' then p_points else 0 end;

    when 'multiple' then
      -- Partial credit: (right picks - wrong picks) / number of correct options, never below 0
      if jsonb_typeof(p_given) <> 'array' then return 0; end if;
      v_correct := p_key->'correct';
      v_n := jsonb_array_length(v_correct);
      select count(*) filter (where v_correct @> jsonb_build_array(g)),
             count(*) filter (where not v_correct @> jsonb_build_array(g))
        into v_right, v_wrong
        from (select distinct g from jsonb_array_elements(p_given) as e(g)) s;
      return round(p_points * greatest(0, v_right - v_wrong)::numeric / greatest(v_n, 1), 2);

    when 'fill_blank' then
      if jsonb_typeof(p_given) <> 'string' then return 0; end if;
      return case when exists (
        select 1 from jsonb_array_elements_text(p_key->'accepted') a
        where normalize_answer(a) = normalize_answer(p_given #>> '{}')
      ) then p_points else 0 end;

    when 'matching' then
      if jsonb_typeof(p_given) <> 'object' then return 0; end if;
      select count(*), count(*) filter (where p_given->k = v)
        into v_n, v_right
        from jsonb_each(p_key->'pairs') as e(k, v);
      return round(p_points * v_right::numeric / greatest(v_n, 1), 2);

    else
      return 0;
  end case;
end;
$$;

-- Submit answers ({"<question_id>": <answer>, ...}), mark everything, return the attempt.
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

  return v_attempt;
end;
$$;

revoke all on function public.start_quiz_attempt(uuid) from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
