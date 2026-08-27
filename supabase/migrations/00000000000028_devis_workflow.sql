-- Suivi commercial des devis : accepter/refuser, générer une facture,
-- marquer payée. Additif — RLS "staff gere les commandes"/"staff gere les
-- factures" (déjà en place, for all using(is_staff())) couvre déjà les
-- écritures nécessaires ; seule une garde fine par permission manquait.

-- Numérotation légale continue : compteur global jamais remis à zéro (la
-- continuité sans trou est l'exigence légale, pas la remise à zéro
-- annuelle qui n'est qu'un usage — un compteur global évite tout risque
-- de doublon).
create sequence invoice_number_seq start 1;

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  if not is_staff() then
    raise exception 'Réservé au staff.';
  end if;
  n := nextval('invoice_number_seq');
  return 'FACT-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 5, '0');
end;
$$;

insert into permissions (key, label, category) values
  ('devis.accept', 'Accepter un devis', 'Devis'),
  ('devis.reject', 'Refuser un devis', 'Devis'),
  ('devis.invoice', 'Générer une facture', 'Devis'),
  ('devis.mark_paid', 'Marquer une facture comme payée', 'Devis');

insert into role_permissions (role, permission_key)
select 'admin', key from permissions where key like 'devis.%';

insert into role_permissions (role, permission_key)
select 'gestionnaire', key from permissions where key like 'devis.%';
