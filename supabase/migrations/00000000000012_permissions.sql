-- RBAC granulaire, additif au modèle existant. Le routage (proxy.ts) et les
-- politiques RLS existantes restent basés sur app_role (5 rôles) — modifier
-- cela impliquerait de transformer l'enum en registre dynamique et de
-- retoucher des dizaines de policies déjà en prod ; risque jugé disproportionné
-- pour ce lot (cf. l'incident RLS de l'agenda plus tôt dans le projet).
-- Cette couche ajoute un contrôle fin PAR RÔLE : l'admin peut retirer à un
-- gestionnaire, par exemple, le droit de supprimer une formation, sans
-- toucher au système de rôles/routage qui fonctionne déjà.

create table permissions (
  key       text primary key,
  label     text not null,
  category  text not null
);

create table role_permissions (
  role            app_role not null,
  permission_key  text not null references permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create or replace function public.has_permission(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Garde-fou : l'admin a toujours tout, même si la table role_permissions
    -- est mal éditée. Même logique que le garde-fou anti-auto-verrouillage
    -- déjà utilisé pour la révocation de rôle.
    has_role('admin')
    or exists (
      select 1
      from user_roles ur
      join role_permissions rp on rp.role = ur.role
      where ur.user_id = (select auth.uid()) and rp.permission_key = p_key
    );
$$;

alter table permissions enable row level security;
alter table role_permissions enable row level security;

create policy "le staff consulte les permissions" on permissions
  for select to authenticated using (is_staff());

create policy "seul l'admin gere le catalogue de permissions" on permissions
  for all to authenticated using (has_role('admin')) with check (has_role('admin'));

create policy "le staff consulte la matrice role/permission" on role_permissions
  for select to authenticated using (is_staff());

create policy "seul l'admin edite la matrice role/permission" on role_permissions
  for all to authenticated using (has_role('admin')) with check (has_role('admin'));

-- Catalogue de permissions (section 4 de la spec complète), restreint aux
-- domaines réellement implémentés dans l'app.
insert into permissions (key, label, category) values
  ('users.view', 'Voir les utilisateurs', 'Utilisateurs'),
  ('users.edit', 'Modifier un utilisateur', 'Utilisateurs'),
  ('roles.edit', 'Attribuer/retirer un rôle', 'Rôles'),
  ('permissions.manage', 'Gérer la matrice des permissions', 'Rôles'),
  ('learners.view', 'Voir les apprenants', 'Apprenants'),
  ('learners.approve', 'Accepter une inscription', 'Apprenants'),
  ('learners.reject', 'Refuser une inscription', 'Apprenants'),
  ('trainers.view', 'Voir les formateurs', 'Formateurs'),
  ('trainers.assign', 'Affecter un formateur à une session', 'Formateurs'),
  ('trainers.manage_availability', 'Gérer ses disponibilités', 'Formateurs'),
  ('formations.view', 'Voir les formations', 'Formations'),
  ('formations.create', 'Créer une formation', 'Formations'),
  ('formations.edit', 'Modifier une formation', 'Formations'),
  ('formations.publish', 'Publier/dépublier une formation', 'Formations'),
  ('formations.delete', 'Supprimer une formation', 'Formations'),
  ('sessions.view', 'Voir les sessions', 'Sessions'),
  ('sessions.create', 'Créer une session', 'Sessions'),
  ('sessions.edit', 'Modifier une session', 'Sessions'),
  ('sessions.cancel', 'Annuler une session', 'Sessions'),
  ('calendar.view', 'Voir l''agenda', 'Agenda'),
  ('bookings.view', 'Voir les réservations', 'Réservations'),
  ('bookings.manage', 'Gérer les réservations', 'Réservations'),
  ('assessments.view', 'Voir les évaluations', 'Évaluations'),
  ('assessments.manage', 'Gérer les évaluations', 'Évaluations'),
  ('documents.view', 'Voir les documents', 'Documents'),
  ('documents.manage', 'Gérer les documents (GED)', 'Documents'),
  ('claims.view', 'Voir les réclamations', 'Réclamations'),
  ('claims.manage', 'Traiter les réclamations', 'Réclamations'),
  ('reports.view', 'Voir les statistiques', 'Rapports'),
  ('settings.view', 'Voir les paramètres', 'Paramètres'),
  ('settings.edit', 'Modifier les paramètres', 'Paramètres');

-- Valeurs par défaut = comportement actuel de l'application (rien ne change
-- pour personne tant que l'admin ne modifie pas la matrice).
insert into role_permissions (role, permission_key)
select 'admin', key from permissions;

insert into role_permissions (role, permission_key)
select 'gestionnaire', key from permissions
where key not in ('users.edit', 'roles.edit', 'permissions.manage', 'settings.edit');

insert into role_permissions (role, permission_key) values
  ('formateur', 'trainers.manage_availability'),
  ('formateur', 'sessions.view'),
  ('formateur', 'calendar.view'),
  ('formateur', 'bookings.view'),
  ('formateur', 'assessments.manage'),
  ('formateur', 'documents.view');

insert into role_permissions (role, permission_key) values
  ('responsable_entreprise', 'learners.view'),
  ('responsable_entreprise', 'reports.view');
