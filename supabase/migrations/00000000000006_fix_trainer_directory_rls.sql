-- Correction critique : la migration précédente ajoutait une politique SELECT
-- sur user_roles ("role = 'formateur'") qui, combinée en OR avec la politique
-- existante, élargissait TOUTE requête non filtrée sur user_roles — or
-- signInAction, la page d'accueil, le proxy (routage par rôle) et la
-- confirmation d'email font tous `select("role")` sans `.eq("user_id", ...)`,
-- en comptant entièrement sur la RLS pour se limiter à l'utilisateur courant.
-- Résultat : n'importe quel utilisateur connecté récupérait aussi les lignes
-- de rôle de tous les formateurs, et pouvait être routé vers /formateur au
-- lieu de son propre espace. On retire cette politique et on la remplace par
-- une fonction security definer (même patron que enrolled_session_ids() et
-- consorts), qui ne fuit rien puisqu'elle n'est jamais utilisée pour
-- "select(role) sans filtre".
drop policy "annuaire des formateurs (roles)" on user_roles;

create or replace function public.formateur_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from user_roles where role = 'formateur';
$$;
