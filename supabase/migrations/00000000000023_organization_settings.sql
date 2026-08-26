-- Fiche d'identité légale de l'organisme, éditable depuis l'admin
-- (admin/parametres) et consommée par les pages publiques mentions
-- légales / confidentialité / CGV. Une seule ligne (idiome Postgres
-- classique id=1 + check), pas d'historique de versions.
create table organization_settings (
  id                     int primary key default 1 check (id = 1),
  legal_name             text,
  legal_form             text,
  siret                  text,
  share_capital          text,
  address_line1          text,
  address_line2          text,
  postal_code            text,
  city                   text,
  publication_director   text,
  contact_email          text,
  contact_phone          text,
  withdrawal_period_days int not null default 14,
  payment_terms          text,
  cancellation_policy    text,
  updated_at             timestamptz not null default now(),
  updated_by             uuid references profiles(id)
);

insert into organization_settings (id) values (1);

alter table organization_settings enable row level security;

-- Information publique par nature (mentions légales) : lecture ouverte à
-- tous, y compris anonyme.
create policy "parametres organisation lisibles par tous" on organization_settings
  for select to anon, authenticated using (true);

-- Garde large au niveau RLS (staff uniquement) ; la permission fine
-- settings.edit (admin par défaut, pas gestionnaire) est vérifiée dans
-- l'action serveur, même motif que partout ailleurs dans ce schéma.
create policy "staff modifie les parametres" on organization_settings
  for all to authenticated using (is_staff()) with check (is_staff());
