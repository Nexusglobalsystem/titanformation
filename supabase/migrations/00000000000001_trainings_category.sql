-- =====================================================================
-- Lot 2 : catégorie de formation, affichée en badge et utilisée comme
-- filtre sur le catalogue public. Colonne libre (pas d'enum) pour rester
-- extensible sans nouvelle migration à chaque nouvelle catégorie.
-- =====================================================================

alter table trainings add column category text;
