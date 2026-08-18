-- Même classe de bug que la migration précédente : cette politique sur
-- profiles fait un sous-select brut sur user_roles, qui est lui-même
-- restreint par RLS. Pour un apprenant (non staff), ce sous-select ne voit
-- que sa propre ligne user_roles, donc l'EXISTS ne trouve jamais la ligne
-- "formateur" d'un AUTRE utilisateur : la politique n'accordait jamais rien
-- en pratique. Comme pour enrolled_session_ids()/trained_session_ids(), il
-- faut passer par la fonction security definer pour court-circuiter la RLS
-- de la sous-requête.
drop policy "annuaire des formateurs (profils)" on profiles;

create policy "annuaire des formateurs (profils)" on profiles
  for select to authenticated using (id in (select formateur_ids()));
