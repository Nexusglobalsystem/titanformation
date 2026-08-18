-- Notifications internes (in-app). Distinct de notifications_log (annexe A),
-- qui est un journal de preuve d'envoi d'e-mails alimenté par les webhooks
-- Resend — pas adapté à une file de notifications lues par un utilisateur.

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "on lit ses propres notifications" on notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "on marque ses propres notifications comme lues" on notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Seul le staff peut notifier directement n'importe qui (inscription
-- confirmée, réclamation traitée...). Le cas apprenant<->formateur (agenda)
-- passe par notify_booking_event ci-dessous, qui vérifie la relation réelle
-- au lieu d'ouvrir l'écriture à tout utilisateur authentifié.
create policy "le staff notifie qui il veut" on notifications
  for insert to authenticated
  with check (is_staff());

create or replace function public.notify_booking_event(p_booking_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings%rowtype;
  target uuid;
  v_title text;
  v_body text;
  v_link text;
begin
  select * into b from bookings where id = p_booking_id;
  if not found or auth.uid() not in (b.trainer_id, b.learner_id) then
    return;
  end if;

  if p_kind = 'created' and auth.uid() = b.learner_id then
    target := b.trainer_id;
    v_title := 'Nouveau rendez-vous';
    v_body := 'Un apprenant a réservé un créneau le ' || to_char(b.booking_date, 'DD/MM/YYYY')
               || ' à ' || to_char(b.start_time, 'HH24:MI') || '.';
    v_link := '/formateur';
  elsif p_kind = 'cancelled' then
    target := case when auth.uid() = b.learner_id then b.trainer_id else b.learner_id end;
    v_title := 'Rendez-vous annulé';
    v_body := 'Le rendez-vous du ' || to_char(b.booking_date, 'DD/MM/YYYY')
               || ' à ' || to_char(b.start_time, 'HH24:MI') || ' a été annulé.';
    v_link := case when target = b.trainer_id then '/formateur' else '/apprenant/reservations' end;
  else
    return;
  end if;

  insert into notifications (user_id, title, body, link) values (target, v_title, v_body, v_link);
end;
$$;
