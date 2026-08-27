-- Emails transactionnels : notify_devis_request() alerte déjà le staff en
-- in-app, mais renvoie void — rien d'exploitable pour un envoi email côté
-- serveur applicatif. Fonction jumelle, même vérification de relation que
-- notify_devis_request(), qui renvoie cette fois les emails du staff
-- plutôt que d'insérer une notification.
create or replace function public.staff_emails_for_devis_order(p_order_id uuid)
returns table(email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  o orders%rowtype;
begin
  select * into o from orders where id = p_order_id;
  if not found or o.status <> 'devis' then
    return;
  end if;
  if auth.uid() <> o.buyer_id and o.company_id not in (select managed_company_ids()) then
    return;
  end if;

  -- p.email est citext ; cast explicite requis, Postgres ne coerce pas
  -- implicitement citext -> text dans un RETURN QUERY (erreur 42804 sinon).
  return query
    select p.email::text from profiles p
    join user_roles ur on ur.user_id = p.id
    where ur.role in ('admin', 'gestionnaire');
end;
$$;
