-- Deverrouillage progressif des modules, opt-in par formation. Desactive par
-- defaut : aucune formation existante ne change de comportement sans action
-- explicite de l'equipe pedagogique.
alter table trainings add column sequential_unlock boolean not null default false;
