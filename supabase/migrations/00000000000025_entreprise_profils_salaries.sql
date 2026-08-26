-- Trou RLS trouvé pendant la vérification du chantier espace entreprise :
-- aucune policy ne permet à un responsable de lire le profil (nom, email)
-- de ses propres salariés — seul son propre profil, le staff, ou un
-- formateur pour ses apprenants le peuvent (00000000000000_init.sql).
-- Additif, même motif que "formateur voit ses apprenants" juste au-dessus.
create policy "responsable voit les profils de ses salaries" on profiles
  for select to authenticated using (
    exists (
      select 1 from company_members cm
      where cm.user_id = profiles.id
        and cm.company_id in (select managed_company_ids())
    )
  );
