# Titan Kinetic

LMS certifié Qualiopi — Lot 1 (bootstrap monorepo, design system, authentification,
routage par rôle, tests RLS).

## Stack

Turborepo + pnpm · Next.js (App Router, TS strict, Tailwind v4) · Expo (coquille) ·
Supabase (Postgres, Auth) — voir `prompt kinetic.md` pour le détail complet.

## Prérequis

- Node ≥ 20
- pnpm (`corepack enable` puis `corepack prepare pnpm@11.21.0 --activate`, ou `npx pnpm@11.21.0 <commande>` sans installation globale)
- Un accès au projet Supabase cloud **« Nexusglobalsystem's Project »** (`svenjjuajujnrccmfzkc`, région `eu-west-3`). Le développement de ce lot se fait contre cette instance distante — pas de Supabase local (Docker non disponible sur ce poste).

## Installation

```bash
pnpm install
```

### Variables d'environnement

Copier `apps/web/.env.example` vers `apps/web/.env.local` (déjà fait dans ce dépôt
avec les valeurs publiques du projet). Il ne manque que la clé service_role :

1. Dashboard Supabase → le projet → **Project Settings → API Keys**.
2. Copier la clé `service_role` (secrète, jamais `NEXT_PUBLIC_`) dans
   `apps/web/.env.local`, variable `SUPABASE_SERVICE_ROLE_KEY`.

Cette clé n'est nécessaire que pour le script de seed et les tests RLS (ils
tournent en Node, pas dans le navigateur).

### Lancer le site web

```bash
pnpm dev
```

→ http://localhost:3000. Page de démonstration du design system :
`/design-system`.

### Peupler des données de démonstration

```bash
pnpm seed
```

Crée : 1 admin, 1 gestionnaire, 2 formateurs, 1 entreprise (Constructa BTP) avec
1 responsable et 3 salariés, 5 apprenants particuliers, 2 formations publiées et
1 session à venir (15–17 septembre 2026). Mot de passe commun affiché par le
script (`TitanKinetic2026!`).

Comptes créés :

| Rôle | Email |
|---|---|
| admin | admin@titankinetic.fr |
| gestionnaire | gestion@titankinetic.fr |
| formateur | f.bernard@titankinetic.fr |
| formateur | s.lecomte@titankinetic.fr |
| responsable_entreprise | r.perrin@constructa-btp.fr |
| apprenant (salarié) | julie.faure@constructa-btp.fr, mehdi.belkacem@constructa-btp.fr, nora.chevallier@constructa-btp.fr |
| apprenant (particulier) | claire.dubois@exemple.fr, karim.haddad@exemple.fr, lea.martin@exemple.fr, thomas.roux@exemple.fr, amandine.petit@exemple.fr (accents retirés des emails) |

Chaque rôle atterrit sur son espace après connexion : `/admin` (admin,
gestionnaire), `/formateur`, `/entreprise`, `/apprenant`. Toute tentative
d'accès à un espace non autorisé redirige vers l'espace légitime de
l'utilisateur (ou vers `/connexion` si non authentifié).

### Tests

```bash
pnpm test
```

Inclut les tests RLS obligatoires (`packages/core/tests/rls.test.ts`) : pour
`profiles`, `user_roles`, `enrollments` et `attendances`, vérifie qu'un
utilisateur ne peut jamais lire les lignes d'un autre. Ces tests créent leurs
propres utilisateurs et données de test (préfixe `test-rls-`) et les nettoient
à la fin — ils tournent en intégration contre le projet Supabase cloud et
nécessitent `SUPABASE_SERVICE_ROLE_KEY`.

## Structure

```
apps/
  web/      Next.js — site public, espaces apprenant / formateur / entreprise / admin
  mobile/   Expo — coquille minimale (pas de fonctionnalité dans ce lot)
packages/
  core/     types Supabase générés, clients, schémas Zod, script de seed, tests RLS
  ui/       design system partagé (tokens + primitives)
supabase/
  migrations/   migration initiale (annexe A du prompt d'amorçage)
```

## Écarts par rapport à la maquette / au prompt d'amorçage

Voir le résumé de fin de lot fourni dans la conversation pour le détail complet
(bugs corrigés dans l'annexe A avec validation préalable, écrans d'authentification
extrapolés en l'absence de maquette Stitch pour ces écrans).
