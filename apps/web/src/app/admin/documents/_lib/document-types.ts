export const DOCUMENT_TYPES = [
  "programme",
  "convention",
  "contrat",
  "convocation",
  "feuille_emargement",
  "certificat_realisation",
  "attestation_fin_formation",
  "evaluation_synthese",
  "autre",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  programme: "Programme de formation",
  convention: "Convention de formation",
  contrat: "Contrat de formation",
  convocation: "Convocation",
  feuille_emargement: "Feuille d'émargement",
  certificat_realisation: "Certificat de réalisation",
  attestation_fin_formation: "Attestation de fin de formation",
  evaluation_synthese: "Synthèse d'évaluation",
  autre: "Autre document",
};
