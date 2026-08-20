-- Modalite par creneau (presentiel / classe virtuelle / auto-apprentissage /
-- evaluation / certification), separee de training_step_type comme
-- lesson_type et training_step_type le sont deja. Backfill : un creneau qui
-- avait deja un livekit_room_name devient 'livekit', tous les autres (seul
-- cas existant en prod) restent 'presentiel' — aucun changement de
-- comportement pour les creneaux deja crees.
create type session_slot_modality as enum ('presentiel', 'livekit', 'autoapprentissage', 'evaluation', 'certification');

alter table session_slots add column modality session_slot_modality not null default 'presentiel';

update session_slots set modality = 'livekit' where livekit_room_name is not null;
