-- Le formulaire "Ajouter un salarié" doit pouvoir retrouver un compte
-- existant par email AVANT qu'il ne soit rattaché à l'entreprise — à ce
-- stade, aucune policy RLS sur profiles ne permet de le voir (ni soi,
-- ni staff, ni formateur, ni "salarié géré" puisqu'il ne l'est pas
-- encore). Fonction security-definer volontairement minimale : expose
-- seulement id/prénom/nom pour une correspondance email exacte, jamais
-- une liste, jamais l'email lui-même — pas d'annuaire d'utilisateurs.
create or replace function public.find_profile_by_email(p_email text)
returns table(id uuid, first_name text, last_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.first_name, p.last_name
  from profiles p
  where p.email = p_email
  limit 1;
$$;
