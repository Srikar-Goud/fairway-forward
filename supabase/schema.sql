-- Digital Heroes / Fairway Forward schema
-- Run in a NEW Supabase project's SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  selected_charity_id text,
  charity_percent numeric(5,2) not null default 10 check (charity_percent >= 10 and charity_percent <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.charities (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  status text not null default 'inactive' check (status in ('active','inactive','cancelled','lapsed','past_due')),
  amount numeric(12,2) not null,
  charity_id text,
  charity_percent numeric(5,2) not null default 10 check (charity_percent >= 10 and charity_percent <= 100),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 45),
  score_date date not null,
  created_at timestamptz not null default now(),
  unique(user_id, score_date)
);

create index if not exists scores_user_date_idx on public.scores(user_id, score_date desc);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null unique,
  draw_type text not null default 'random' check (draw_type in ('random','algorithmic')),
  status text not null default 'simulated' check (status in ('simulated','published','closed')),
  numbers integer[] not null,
  active_subscribers integer not null default 0,
  total_pool numeric(12,2) not null default 0,
  jackpot_rollover numeric(12,2) not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_count smallint not null check (match_count between 3 and 5),
  prize_amount numeric(12,2) not null default 0,
  proof_url text,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.donation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  charity_id text,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  source text not null default 'subscription',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.winners enable row level security;
alter table public.donation_events enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "charities public read" on public.charities for select using (active = true or public.is_admin());
create policy "charities admin write" on public.charities for all using (public.is_admin()) with check (public.is_admin());
create policy "subscriptions own" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions own insert" on public.subscriptions for insert with check (user_id = auth.uid());
create policy "subscriptions own update" on public.subscriptions for update using (user_id = auth.uid() or public.is_admin());
create policy "scores own" on public.scores for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "draws published read" on public.draws for select using (status = 'published' or public.is_admin());
create policy "draws admin write" on public.draws for all using (public.is_admin()) with check (public.is_admin());
create policy "winners own read" on public.winners for select using (user_id = auth.uid() or public.is_admin());
create policy "winners own proof update" on public.winners for update using (user_id = auth.uid() or public.is_admin());
create policy "winners admin write" on public.winners for all using (public.is_admin()) with check (public.is_admin());
create policy "donations admin read" on public.donation_events for select using (user_id = auth.uid() or public.is_admin());
create policy "donations admin write" on public.donation_events for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, full_name, email) values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Enforce the rolling five-score requirement server-side.
create or replace function public.enforce_five_scores() returns trigger language plpgsql security definer set search_path=public as $$
begin
  delete from public.scores
  where user_id = new.user_id
    and id not in (
      select id from public.scores where user_id = new.user_id order by score_date desc, created_at desc limit 5
    );
  return new;
end;
$$;
drop trigger if exists score_rolling_limit on public.scores;
create trigger score_rolling_limit after insert on public.scores for each row execute procedure public.enforce_five_scores();

insert into public.charities(id,name,category,description) values
('greenways','Greenways Community Trust','Environment','Restoring local habitats and community green spaces.'),
('fairplay','Fair Play Youth Foundation','Youth','Giving young people access to mentoring, sport and opportunity.'),
('clubhouse','The Clubhouse Project','Community','Creating welcoming places where isolated adults can connect.')
on conflict (id) do update set name=excluded.name, category=excluded.category, description=excluded.description;

-- After creating your own account, promote it to admin with:
-- update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL';


-- Private storage bucket for winner proof. Users may upload only inside their own folder.
insert into storage.buckets (id, name, public) values ('winner-proofs', 'winner-proofs', false) on conflict (id) do nothing;
create policy "winner proof own upload" on storage.objects for insert to authenticated with check (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "winner proof own read" on storage.objects for select to authenticated using (bucket_id = 'winner-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "winner proof admin delete" on storage.objects for delete to authenticated using (bucket_id = 'winner-proofs' and public.is_admin());
