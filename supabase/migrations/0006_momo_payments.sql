-- EduVision Academy - MoMo Pay code payments reviewed by an admin
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Flow: student pays with the MoMo Pay code, submits the transaction ID,
-- an admin checks the MoMo account and approves (course unlocks) or rejects.

-- ─────────────────────────────────────────────────────────────
-- Payment settings (one row, edited in Admin -> Settings)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.settings (
  id                 int primary key default 1 check (id = 1),
  momo_pay_code      text not null default '',
  momo_account_name  text not null default 'EduVision Academy',
  payment_note       text not null default '',
  updated_at         timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;
drop policy if exists "anyone reads settings" on public.settings;
create policy "anyone reads settings" on public.settings for select using (true);
drop policy if exists "admins update settings" on public.settings;
create policy "admins update settings" on public.settings for update using (is_admin()) with check (is_admin());

-- ─────────────────────────────────────────────────────────────
-- Payments
-- ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete cascade,
  method          text not null default 'momo' check (method in ('momo', 'manual')),
  amount          numeric(12, 2),
  currency        text not null default 'RWF',
  payer_phone     text not null default '',
  payer_name      text not null default '',
  transaction_id  text not null default '',
  status          text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  admin_note      text not null default '',
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null
);
create index if not exists payments_status_idx on public.payments (status, created_at desc);
create index if not exists payments_user_course_idx on public.payments (user_id, course_id, created_at desc);
-- A MoMo transaction can only pay for one enrollment (rejected ones can be reused)
create unique index if not exists payments_transaction_unique
  on public.payments (upper(transaction_id)) where status <> 'rejected' and transaction_id <> '';

alter table public.payments enable row level security;
drop policy if exists "read own payments or admin" on public.payments;
create policy "read own payments or admin" on public.payments
  for select using (user_id = auth.uid() or is_admin());
-- No insert/update policies: payments change only through the functions below.

-- Student: "I paid, here is my transaction ID"
create or replace function public.submit_payment(
  p_course_id uuid, p_transaction_id text, p_payer_phone text, p_payer_name text default ''
) returns payments language plpgsql security definer set search_path = public as $$
declare
  v_course  courses;
  v_txid    text := upper(regexp_replace(coalesce(p_transaction_id, ''), '\s', '', 'g'));
  v_row     payments;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;

  select * into v_course from courses where id = p_course_id and published;
  if not found then raise exception 'Course not found.'; end if;
  if v_course.price is null then raise exception 'The fee for this course is not set yet. Please contact us.'; end if;
  if v_course.price = 0 then raise exception 'This course is free. No payment needed.'; end if;

  if exists (select 1 from enrollments where user_id = auth.uid() and course_id = p_course_id and status = 'active') then
    raise exception 'You are already enrolled in this course.';
  end if;
  if exists (select 1 from payments where user_id = auth.uid() and course_id = p_course_id and status = 'submitted') then
    raise exception 'We already received your payment details for this course and are checking them.';
  end if;
  if v_txid !~ '^[A-Z0-9.\-]{6,40}$' then
    raise exception 'Please enter the transaction ID exactly as it appears in your MoMo SMS.';
  end if;
  if coalesce(btrim(p_payer_phone), '') = '' then raise exception 'Please enter the phone number you paid from.'; end if;

  -- Make sure there is a reservation to unlock later
  insert into enrollments (user_id, course_id, status) values (auth.uid(), p_course_id, 'pending')
  on conflict (user_id, course_id) do update
    set status = case when enrollments.status = 'cancelled' then 'pending' else enrollments.status end;

  begin
    insert into payments (user_id, course_id, method, amount, currency, payer_phone, payer_name, transaction_id)
    values (auth.uid(), p_course_id, 'momo', v_course.price, v_course.currency,
            btrim(p_payer_phone), btrim(coalesce(p_payer_name, '')), v_txid)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'This transaction ID has already been used. Please check your MoMo SMS.';
  end;

  return v_row;
end;
$$;

-- Admin: approve (unlocks the course) or reject (student sees the reason and can try again)
create or replace function public.review_payment(p_payment_id uuid, p_approve boolean, p_note text default '')
returns payments language plpgsql security definer set search_path = public as $$
declare
  v_row payments;
begin
  if not is_admin() then raise exception 'Only admins can review payments.'; end if;

  select * into v_row from payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found.'; end if;
  if v_row.status <> 'submitted' then raise exception 'This payment was already %.', v_row.status; end if;
  if not p_approve and coalesce(btrim(p_note), '') = '' then
    raise exception 'Please write a reason so the student knows what to fix.';
  end if;

  update payments set
    status = case when p_approve then 'approved' else 'rejected' end,
    admin_note = coalesce(btrim(p_note), ''),
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_payment_id
  returning * into v_row;

  if p_approve then
    insert into enrollments (user_id, course_id, status, paid_at) values (v_row.user_id, v_row.course_id, 'active', now())
    on conflict (user_id, course_id) do update set status = 'active', paid_at = now();
  end if;

  return v_row;
end;
$$;

revoke all on function public.submit_payment(uuid, text, text, text) from public, anon;
revoke all on function public.review_payment(uuid, boolean, text) from public, anon;
grant execute on function public.submit_payment(uuid, text, text, text) to authenticated;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;
