-- EduVision Academy - School of English and Communication
-- Three flagship programmes; the earlier starter courses are hidden (not deleted).
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- MTN MoMo Pay code students pay to
update public.settings
set momo_pay_code = '1794079', momo_account_name = 'EduVision Academy', updated_at = now()
where id = 1 and momo_pay_code = '';

-- Hide the earlier starter courses (re-publish any of them in Admin -> Courses)
update public.courses set published = false
where slug in ('english', 'french', 'swahili', 'chinese', 'photography-videography', 'traffic-rules');

insert into public.courses (slug, title, description, category, icon, accent, level, language, price, currency, cover_url, outcomes, published, position) values
  ('english-language-certification',
   'English Language Certification',
   'Get the English certificate universities and employers ask for. Structured preparation for IELTS, TOEFL and the Duolingo English Test, with mock tests and instant feedback.',
   'Certification', 'award', 'teal', 'Intermediate to advanced', 'English', null, 'RWF', '/images/exam-room.webp',
   array['Prepare for IELTS, TOEFL and the Duolingo English Test',
         'Master every exam format and manage your time',
         'Strengthen reading, writing, listening and speaking',
         'Practise with mock tests marked instantly'],
   true, 1),
  ('english-fluency-communication',
   'English Fluency and Communication',
   'Speak English naturally and with confidence, at work, in school and in everyday life. Build vocabulary, pronunciation and real conversation skills.',
   'Fluency', 'chat', 'orange', 'All levels', 'English', null, 'RWF', '/images/front-desk.webp',
   array['Speak English naturally and confidently',
         'Expand everyday and workplace vocabulary',
         'Improve pronunciation and listening with audio lessons',
         'Hold real conversations without hesitation'],
   true, 2),
  ('public-speaking-professional-communication',
   'Public Speaking and Professional Communication',
   'Present, persuade and lead with confidence. Learn to structure talks, master your voice and body language, and communicate professionally in meetings, emails and interviews.',
   'Public speaking', 'users', 'teal', 'All levels', 'English', null, 'RWF', '/images/instructor-studio.webp',
   array['Speak confidently in front of any audience',
         'Structure clear and persuasive presentations',
         'Master your voice, body language and presence',
         'Communicate professionally in meetings, emails and interviews'],
   true, 3)
on conflict (slug) do nothing;
