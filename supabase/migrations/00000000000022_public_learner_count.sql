-- Comptage public du nombre d'apprenants distincts formes (inscription
-- confirmee ou terminee), sans exposer les inscriptions elles-memes
-- (protegees par RLS). Meme idiome que training_enrollment_counts() —
-- utilise pour la section "chiffres cles" de l'accueil.
create or replace function public_learner_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct learner_id) from enrollments where status in ('confirme', 'termine');
$$;

grant execute on function public_learner_count() to anon, authenticated;
