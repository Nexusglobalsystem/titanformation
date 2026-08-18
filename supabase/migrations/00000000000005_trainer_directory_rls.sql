-- L'apprenant doit pouvoir découvrir la liste des formateurs pour réserver
-- un rendez-vous (agenda/créneaux, cf. migration précédente). Jusqu'ici
-- user_roles/profiles n'étaient lisibles que par soi-même, le staff, ou
-- (pour profiles) un formateur regardant ses propres apprenants — jamais
-- l'inverse. On ouvre un annuaire public restreint au rôle 'formateur'.

create policy "annuaire des formateurs (roles)" on user_roles
  for select to authenticated using (role = 'formateur');

create policy "annuaire des formateurs (profils)" on profiles
  for select to authenticated using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = profiles.id and ur.role = 'formateur'
    )
  );
