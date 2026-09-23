# Compte rendu — corrections et refonte Titan Kinetic

## Corrections livrées

| Point du diagnostic                          | Correction                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Certificat obtenu en contournant l’interface | Critères vérifiés dans Postgres avant insertion ; numéro et date imposés par le serveur ; certificat non modifiable par l’apprenant.       |
| Permissions fines limitées à l’interface     | Policies RLS restrictives pour les opérations de gestion ; contrôles supplémentaires de publication, annulation, facturation et paiements. |
| Quiz aléatoire noté sur toutes les questions | Tirage enregistré dans un schéma privé, réutilisé à la reprise et utilisé pour la correction.                                              |
| Durée du quiz seulement informative          | Date limite enregistrée et contrôlée lors de la soumission ; compte à rebours sur le web.                                                  |
| Notes de zéro exclues de la moyenne          | Moyenne des meilleurs scores incluant les zéros et les quiz non tentés.                                                                    |
| Règles dupliquées entre web et mobile        | Certification, déverrouillage et URL vidéo déplacés dans packages/core.                                                                    |
| Tests RLS modifiant les réglages réels       | Tests unitaires par défaut ; intégration explicitement réservée à une base séparée ; restauration des valeurs antérieures.                 |
| Lecteur vidéo factice                        | Lecteurs Mux, Cloudflare et Bunny à partir d’identifiants validés ; ouverture adaptée sur mobile.                                          |
| Session expirée présentée comme prochaine    | Filtrage des dates passées dans le catalogue et la fiche formation.                                                                        |
| Rafraîchissement de session incomplet        | Propagation des cookies Supabase y compris lors des redirections.                                                                          |
| Erreurs TypeScript et lint                   | Types de layout corrigés, effets inutiles supprimés, identifiants de réactions stabilisés, textes JSX corrigés.                            |

## Expérience utilisateur

Accueil avec composition orbitale animée et onglets au clavier ; recherche et catégories reliées aux données réelles ; cartes de formation, navigation mobile et pied de page repensés ; palette vert profond, sauge et corail ; espace de travail harmonisé ; mode concentration pour les leçons ; progression et retours de quiz plus lisibles. Les préférences de réduction des animations sont respectées.

Les prix, intitulés, notes de satisfaction et nombres d’inscrits restent ceux du catalogue existant. Ils n’ont pas été remplacés par des statistiques ou témoignages inventés.

## Déploiement et vérifications

- Supabase : migration learning_integrity appliquée, version 20260922084518 ; quiz-attempt version 4 active.
- Contrôle après déploiement : RPC quiz interdite aux visiteurs anonymes ; schéma des réponses inaccessible au rôle authenticated ; trigger de certificat présent ; requête HTTP sans session refusée avec le statut 401.
- Tests SQL isolés : migrations complètes et régressions de propriété, certification, score, durée et permissions validées.
- Types, lint et 10 tests unitaires validés.
- Accueil contrôlé dans Edge sur ordinateur et mobile ; onglets au clavier, absence de débordement à 320/390/768 px, audit WCAG sans violation détectée sur l’accueil après corrections.
- Compilation de production réussie (43 pages générées). Parcours accueil → catalogue → recherche sans résultat → remise à zéro → fiche formation, puis accès protégé → connexion : validés dans Edge. Six audits WCAG A/AA sans violation détectée et aucune erreur JavaScript non gérée.
- Vercel : prévisualisation déployée automatiquement depuis GitHub, statut Ready. Accueil, onglets et navigation vers le catalogue filtré vérifiés en ligne, sans erreur console observée. Le connecteur reste sans accès direct à l’équipe ; cela n’a pas empêché le déploiement GitHub.
- [Prévisualisation](https://titan-kinetic-git-codex-immersive-learning-integrity-nexus-1491.vercel.app) — code validé au commit a4c17b2.
- [Demande de revue](https://github.com/Nexusglobalsystem/titanformation/pull/1), conservée en brouillon ; branche master non fusionnée.

## Limites et points de suivi

Les parcours privés n’ont pas été testés avec un compte réel de production. Les intégrations vidéo, LiveKit, Resend et Anthropic nécessitent des ressources et clés configurées ; aucun paiement ni envoi d’e-mail réel n’a été déclenché pour les tests.

L’audit Supabase conserve des avertissements : extension citext dans public, protection contre les mots de passe compromis désactivée, fonctions SECURITY DEFINER exposées. Plusieurs fonctions sont volontairement nécessaires aux policies ou aux statistiques publiques : chaque avertissement demande une analyse ciblée, pas une révocation générale. Le schéma privé des tirages a volontairement RLS activé sans policy, afin d’interdire tout accès direct. Le search_path modifiable de set_withdrawal_deadline a été corrigé.

Références : [audit des fonctions Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [sécurité des mots de passe](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Les migrations historiques locales et cloud ont des numérotations différentes. Ne pas rejouer automatiquement les anciens fichiers sur le projet existant ; la nouvelle migration locale porte exactement la version appliquée.

La branche de livraison conserve les 30 commits mobiles déjà présents localement mais absents de origin/master ; aucun de ces développements n’a été supprimé.
