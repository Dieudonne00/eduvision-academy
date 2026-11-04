-- EduVision Academy - file uploads (course thumbnails and audio lessons)
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- thumbnails: public (shown on the website), max 5 MB
-- audio:      private (only admins and enrolled students can play), max 50 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('audio', 'audio', false, 52428800,
   array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only admins can upload, replace or delete files
drop policy if exists "admins manage thumbnails" on storage.objects;
create policy "admins manage thumbnails" on storage.objects for all to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin())
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "admins manage audio" on storage.objects;
create policy "admins manage audio" on storage.objects for all to authenticated
  using (bucket_id = 'audio' and public.is_admin())
  with check (bucket_id = 'audio' and public.is_admin());

-- Audio files are stored as <course id>/<file>; students enrolled in that course can play them
drop policy if exists "enrolled students play audio" on storage.objects;
create policy "enrolled students play audio" on storage.objects for select to authenticated
  using (
    bucket_id = 'audio'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then public.is_enrolled(((storage.foldername(name))[1])::uuid)
             else false end
  );
