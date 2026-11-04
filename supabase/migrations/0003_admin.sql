-- EduVision Academy - admin panel support
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- ─────────────────────────────────────────────────────────────
-- Email on profiles so admins can see who each student is
-- (auth.users itself is not readable from the app)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists email text not null default '';

update public.profiles p set email = u.email
from auth.users u
where u.id = p.id and p.email = '';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

-- Keep it in sync if a user changes their email
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ─────────────────────────────────────────────────────────────
-- Test admin account
-- Create it first in Authentication -> Users -> Add user (tick Auto Confirm),
-- then this line gives it admin rights. Change the email if you used another.
-- ─────────────────────────────────────────────────────────────
update public.profiles set role = 'admin' where email = 'admin@eduvisionacademy.com';

-- Shows the result: you should see one row with role = admin
select email, full_name, role from public.profiles where role = 'admin';
