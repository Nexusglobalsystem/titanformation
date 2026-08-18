-- Agenda : disponibilités formateur + créneaux réservables individuels,
-- indépendants des sessions de formation collectives (cf. spécification
-- "plateforme-formation-specifications.md", sections 13-15).

create table trainer_availabilities (
  id                    uuid primary key default gen_random_uuid(),
  trainer_id            uuid not null references profiles(id) on delete cascade,
  weekday               smallint not null check (weekday between 0 and 6), -- 0 = lundi
  start_time            time not null,
  end_time              time not null,
  slot_duration_minutes int not null default 30 check (slot_duration_minutes > 0),
  created_at            timestamptz not null default now(),
  check (end_time > start_time)
);

create index on trainer_availabilities (trainer_id);

create table availability_exceptions (
  id             uuid primary key default gen_random_uuid(),
  trainer_id     uuid not null references profiles(id) on delete cascade,
  exception_date date not null,
  start_time     time,  -- null + end_time null = journée entière bloquée
  end_time       time,
  reason         text,
  created_at     timestamptz not null default now(),
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index on availability_exceptions (trainer_id, exception_date);

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references profiles(id) on delete restrict,
  learner_id   uuid not null references profiles(id) on delete restrict,
  booking_date date not null,
  start_time   time not null,
  end_time     time not null,
  reason       text,
  status       text not null default 'confirmee'
                 check (status in ('demandee','confirmee','annulee','terminee','absent')),
  created_at   timestamptz not null default now(),
  check (end_time > start_time),
  unique (trainer_id, booking_date, start_time) -- un créneau ne peut être pris deux fois
);

create index on bookings (trainer_id, booking_date);
create index on bookings (learner_id);

-- Expose les créneaux déjà pris sans exposer l'identité de l'apprenant
-- (l'apprenant qui consulte les disponibilités d'un formateur ne doit pas
-- voir qui a réservé quoi, seulement que le créneau n'est plus libre).
create or replace function public.taken_slots(p_trainer_id uuid, p_from date, p_to date)
returns table (booking_date date, start_time time)
language sql
stable
security definer
set search_path = public
as $$
  select b.booking_date, b.start_time
  from bookings b
  where b.trainer_id = p_trainer_id
    and b.booking_date between p_from and p_to
    and b.status <> 'annulee';
$$;

alter table trainer_availabilities enable row level security;
alter table availability_exceptions enable row level security;
alter table bookings enable row level security;

create policy "formateur gere ses disponibilites" on trainer_availabilities
  for all to authenticated
  using (trainer_id = (select auth.uid()) or is_staff())
  with check (trainer_id = (select auth.uid()) or is_staff());

create policy "disponibilites visibles par les authentifies" on trainer_availabilities
  for select to authenticated using (true);

create policy "formateur gere ses exceptions" on availability_exceptions
  for all to authenticated
  using (trainer_id = (select auth.uid()) or is_staff())
  with check (trainer_id = (select auth.uid()) or is_staff());

create policy "exceptions visibles par les authentifies" on availability_exceptions
  for select to authenticated using (true);

create policy "staff gere les reservations" on bookings
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "formateur gere ses rendez-vous" on bookings
  for all to authenticated
  using (trainer_id = (select auth.uid()))
  with check (trainer_id = (select auth.uid()));

create policy "apprenant gere ses reservations" on bookings
  for all to authenticated
  using (learner_id = (select auth.uid()))
  with check (learner_id = (select auth.uid()) and status in ('confirmee','annulee'));
