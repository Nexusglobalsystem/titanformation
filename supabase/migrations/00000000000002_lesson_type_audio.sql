-- =====================================================================
-- Ajoute le type de leçon "audio" (jusque-là : video, quiz, document,
-- live_slot, texte). Le fichier audio est stocké dans Supabase Storage
-- via la colonne lessons.document_path existante (pas de transcodage
-- ni de HLS nécessaires pour de l'audio, contrairement à la vidéo —
-- la contrainte de la section 2 du prompt ne s'applique qu'à la vidéo).
-- =====================================================================

alter type lesson_type add value 'audio';
