-- EduVision Academy - programmes, prices and registration fee (from the official fee list)
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

-- MTN MoMo Pay code and the one-time registration fee
update public.settings
set momo_pay_code = case when momo_pay_code = '' then '1794079' else momo_pay_code end,
    momo_account_name = 'EduVision Academy',
    registration_fee = 10000,
    updated_at = now()
where id = 1;

-- Flagship English & Communication programmes
insert into public.courses (slug, title, description, category, icon, accent, level, language, price, currency, cover_url, outcomes, published, position) values
  ('english-language-certification',
   'English Language Certification',
   'Get a recognised certificate for your English. Structured preparation for TOEFL, IELTS and the Duolingo English Test, with mock tests and instant feedback.',
   'English & Communication', 'award', 'teal', 'Intermediate to advanced', 'English', 120000, 'RWF', '/images/exam-room.webp',
   array['Prepare for TOEFL, IELTS and the Duolingo English Test',
         'Master every exam format and manage your time',
         'Strengthen reading, writing, listening and speaking',
         'Earn a recognised EduVision certificate'],
   true, 1),
  ('english-fluency-communication',
   'English Fluency and Communication',
   'Speak English naturally and with confidence, at work, in school and in everyday life. Build vocabulary, pronunciation and real conversation skills.',
   'English & Communication', 'chat', 'orange', 'All levels', 'English', null, 'RWF', '/images/front-desk.webp',
   array['Speak English naturally and confidently',
         'Expand everyday and workplace vocabulary',
         'Improve pronunciation and listening with audio lessons',
         'Hold real conversations without hesitation'],
   true, 2),
  ('public-speaking-professional-communication',
   'Public Speaking and Professional Communication',
   'Present, persuade and lead with confidence. Learn to structure talks, master your voice and body language, and communicate professionally in meetings, emails and interviews.',
   'English & Communication', 'users', 'teal', 'All levels', 'English', null, 'RWF', '/images/instructor-studio.webp',
   array['Speak confidently in front of any audience',
         'Structure clear and persuasive presentations',
         'Master your voice, body language and presence',
         'Communicate professionally in meetings, emails and interviews'],
   true, 3),
  ('german', 'German',
   'Start German from the basics and build real conversation skills for study, work and travel.',
   'Languages', 'globe', 'teal', 'All levels', 'German', 100000, 'RWF', null,
   array['Greet, introduce yourself and handle everyday situations',
         'Build core vocabulary and grammar step by step',
         'Improve listening and pronunciation with audio lessons',
         'Prepare for study or work in German-speaking countries'],
   true, 8)
on conflict (slug) do nothing;

-- Language courses and skills: prices from the fee list, all visible again
update public.courses c set price = v.price, category = v.category, position = v.position, published = true
from (values
  ('english-language-certification', 120000, 'English & Communication', 1),
  ('english',                          70000, 'Languages', 4),
  ('french',                           70000, 'Languages', 5),
  ('chinese',                         150000, 'Languages', 6),
  ('swahili',                         100000, 'Languages', 7),
  ('german',                          100000, 'Languages', 8),
  ('photography-videography',          80000, 'Skills', 9),
  ('traffic-rules',                    20000, 'Skills', 10)
) as v(slug, price, category, position)
where c.slug = v.slug;

update public.courses set title = 'English', description =
  'Everyday English from the basics: speaking, listening, reading and writing, at your own pace.'
where slug = 'english' and description like 'Speak fluently%';

update public.courses set description =
  'Build everyday French for work, travel and study, and prepare for the DEF and TEF exams.',
  outcomes = array['Hold everyday conversations in French',
                   'Build vocabulary and grammar step by step',
                   'Improve listening and pronunciation with audio lessons',
                   'Prepare for the DEF and TEF exams']
where slug = 'french' and outcomes = '{}';
