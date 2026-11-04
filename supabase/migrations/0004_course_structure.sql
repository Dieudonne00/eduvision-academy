-- EduVision Academy - richer course structure
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- Courses: how they look on the website and what students will learn
alter table public.courses add column if not exists category text not null default '';
alter table public.courses add column if not exists icon text not null default 'book';
alter table public.courses add column if not exists accent text not null default 'teal'
  check (accent in ('teal', 'orange'));
alter table public.courses add column if not exists outcomes text[] not null default '{}';
alter table public.courses add column if not exists position int not null default 0;

-- Chapters (stored in "modules") get a short description
alter table public.modules add column if not exists description text not null default '';

-- Lesson notes shown under the video / audio. Kept in lesson_media (not lessons)
-- so only enrolled students, free previews and admins can read them.
alter table public.lesson_media add column if not exists notes text not null default '';

-- Fill in the starting six courses
update public.courses c set category = v.category, icon = v.icon, accent = v.accent, position = v.position
from (values
  ('english', 'Languages', 'chat', 'teal', 1),
  ('french', 'Languages', 'globe', 'orange', 2),
  ('swahili', 'Languages', 'chat', 'teal', 3),
  ('chinese', 'Languages', 'globe', 'orange', 4),
  ('photography-videography', 'Creative skills', 'camera', 'teal', 5),
  ('traffic-rules', 'Driving', 'road', 'orange', 6)
) as v(slug, category, icon, accent, position)
where c.slug = v.slug and c.category = '';

update public.courses set outcomes = array[
  'Hold everyday conversations with confidence',
  'Build vocabulary and grammar step by step',
  'Improve listening and pronunciation with audio lessons',
  'Prepare for IELTS, TOEFL and Duolingo'
] where slug = 'english' and outcomes = '{}';

update public.courses set outcomes = array[
  'Understand how a camera works: aperture, shutter speed and ISO',
  'Use light and composition like a professional',
  'Plan shots: angles, framing and shot types',
  'Edit photos and videos creatively'
] where slug = 'photography-videography' and outcomes = '{}';

update public.courses set outcomes = array[
  'Recognise and understand all road signs',
  'Know the rules for every road situation',
  'Practise with exam-style questions',
  'Be ready for your provisional driving test'
] where slug = 'traffic-rules' and outcomes = '{}';

-- Students can only see published chapters/lessons of published courses (unchanged),
-- and admins can manage everything (unchanged). Nothing else to grant here.
