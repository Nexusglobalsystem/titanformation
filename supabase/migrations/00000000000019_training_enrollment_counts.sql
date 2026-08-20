-- Comptage public des inscriptions actives par formation, sans exposer les
-- inscriptions elles-memes (protegees par RLS pour l'apprenant/staff/formateur).
-- Utilise pour le badge "Populaire" du catalogue et de l'accueil.
create or replace function training_enrollment_counts()
returns table (training_id uuid, active_enrollments bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.training_id, count(e.id)
  from sessions s
  join enrollments e on e.session_id = s.id
  where e.status not in ('annule', 'abandonne')
  group by s.training_id;
$$;

grant execute on function training_enrollment_counts() to anon, authenticated;
