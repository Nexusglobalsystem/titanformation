-- Espace entreprise : gestion des salariés + devis. Additif uniquement —
-- aucune policy existante modifiée.

-- Retrait d'un salarié : jusqu'ici seul le staff pouvait supprimer une
-- ligne company_members (policy "staff gere les membres", is_staff()).
-- Restreint à role='salarie' : un responsable ne peut jamais retirer un
-- autre responsable (garde-fou contre l'auto-verrouillage).
create policy "responsable retire ses salaries" on company_members
  for delete to authenticated
  using (company_id in (select managed_company_ids()) and role = 'salarie');

-- Demande de devis : jusqu'ici le responsable n'avait qu'une lecture sur
-- orders/order_items (policies "voir ses commandes"/"voir les lignes de
-- ses commandes"). Strictement scopé à status='devis' et buyer_id=soi-même
-- : impossible de créer une commande dans un autre statut ou d'usurper un
-- autre acheteur.
create policy "responsable demande un devis" on orders
  for insert to authenticated
  with check (
    company_id in (select managed_company_ids())
    and status = 'devis'
    and buyer_id = (select auth.uid())
  );

create policy "responsable ajoute des lignes a son devis" on order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.company_id in (select managed_company_ids())
        and o.status = 'devis'
    )
  );

-- Notification de nouvelle demande de devis, même moule que
-- notify_booking_event() : vérifie la relation réelle de l'appelant à la
-- commande avant d'insérer, puisqu'un responsable (non-staff) ne peut pas
-- notifier directement n'importe qui.
create or replace function public.notify_devis_request(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o orders%rowtype;
  v_company_name text;
  staff_id uuid;
begin
  select * into o from orders where id = p_order_id;
  if not found or o.status <> 'devis' then
    return;
  end if;
  if auth.uid() <> o.buyer_id and o.company_id not in (select managed_company_ids()) then
    return;
  end if;

  select name into v_company_name from companies where id = o.company_id;

  for staff_id in select ur.user_id from user_roles ur where ur.role in ('admin', 'gestionnaire')
  loop
    insert into notifications (user_id, title, body, link)
    values (
      staff_id,
      'Nouvelle demande de devis',
      coalesce(v_company_name, 'Une entreprise') || ' a demandé un devis (' || o.reference || ').',
      '/admin/devis'
    );
  end loop;
end;
$$;
