-- Le UNIQUE (trainer_id, booking_date, start_time) posé sur la table
-- s'appliquait à TOUTES les lignes, y compris les réservations annulées :
-- un créneau réservé puis annulé restait donc bloqué pour toujours, aucun
-- apprenant ne pouvait plus jamais le reprendre. On remplace par un index
-- unique partiel qui ignore les réservations annulées.
alter table bookings drop constraint bookings_trainer_id_booking_date_start_time_key;

create unique index bookings_trainer_slot_active_key
  on bookings (trainer_id, booking_date, start_time)
  where status <> 'annulee';
