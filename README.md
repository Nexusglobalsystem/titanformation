# Titan Kinetic

Plateforme de formation : catalogue public, inscriptions, espace apprenant, quiz, certificats, visioconférence et gestion des formations. Monorepo pnpm/Turborepo avec Next.js, Expo et Supabase.

## Démarrage

Node.js 20 ou supérieur, pnpm 11.21.0.

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @titan-kinetic/web dev
```

Renseigner l’URL Supabase et la clé publique dans le fichier local. Aucun secret n’est nécessaire pour consulter le catalogue. Les intégrations LiveKit, Resend et Anthropic nécessitent leurs clés serveur pour activer leurs fonctions respectives. Ne jamais exposer une clé de service dans une variable NEXT_PUBLIC_ ou EXPO_PUBLIC_.

Le site s’ouvre sur http://localhost:3000. Les espaces authentifiés sont /admin, /formateur, /entreprise et /apprenant. Expo contient les parcours apprenants, le catalogue, les leçons, les quiz et la certification ; ce n’est plus une simple coquille.

Sous Windows/OneDrive, si le cache Turbopack est inaccessible, utiliser PowerShell :

```powershell
$env:NEXT_DIST_DIR='.next-verify'
pnpm --filter @titan-kinetic/web exec next dev --webpack
```

## Vérifications

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Les tests par défaut sont unitaires, sans écriture dans Supabase. Pour vérifier toutes les migrations et les protections de certification/quiz dans un PostgreSQL isolé :

```sh
npm install --prefix .verification --no-audit --no-fund @electric-sql/pglite
node scripts/verify-database.mjs
```

Le harnais PGlite simule auth.uid et les tables Storage ; il valide les règles SQL mais ne remplace pas un test du service Auth et du déploiement Edge.

Les tests d’intégration Auth/RLS exigent un projet Supabase de test distinct. Copier packages/core/.env.test.example vers packages/core/.env.test et renseigner ses trois clés, puis :

```sh
pnpm --filter @titan-kinetic/core test:rls
```

Ces tests refusent le projet de production connu. Ils créent des comptes temporaires et restaurent les réglages modifiés. Ne jamais les lancer sur un projet partagé contenant des données réelles. Le script pnpm seed crée des comptes de démonstration avec un mot de passe commun : il est réservé à une base de développement jetable.

## Déploiement de la correction

1. Appliquer uniquement la migration 20260922084518_learning_integrity.sql au projet existant, après les migrations précédentes.
2. Déployer supabase/functions/quiz-attempt/index.ts. Cette fonction authentifie la session et appelle les RPC de correction ; elle ne possède plus de clé de service pour noter les réponses.
3. Déployer l’application web, puis la version mobile correspondante.

Le projet cloud historique utilise des versions de migrations horodatées, alors que les premiers fichiers locaux utilisent des numéros séquentiels. Ne pas lancer un db push aveugle et ne pas rejouer les anciennes migrations sur cette base. Réconcilier l’historique avant tout futur déploiement global.

Les tentatives anciennes sans tirage enregistré sont clôturées sans réussite lors de leur reprise. Les certificats déjà émis restent conservés. Les nouvelles demandes sont validées dans Postgres : leçons obligatoires, notes, examen, assiduité et validation pédagogique configurés. Le tirage et la date limite des quiz sont conservés côté serveur. Les permissions fines complètent les règles RLS existantes.

## Organisation

- apps/web : site public et espaces de travail Next.js.
- apps/mobile : application apprenant Expo.
- packages/core : types, schémas, clients Supabase et règles de progression/certification partagées.
- packages/ui : composants et tokens de style.
- supabase : migrations SQL et Edge Functions.
- scripts/verify-database.mjs : vérification isolée des migrations et régressions.

La nouvelle interface utilise des animations CSS légères, respecte prefers-reduced-motion et propose un mode concentration dans le lecteur de leçons. Les cartes et les indicateurs affichent les données réelles du catalogue.

## Vérification du navigateur

Installer les outils dans le répertoire ignoré :

```sh
npm install --prefix .verification --no-audit --no-fund @playwright/test @axe-core/playwright
node scripts/verify-ui.mjs
```

Le serveur doit être démarré. TEST_BASE_URL permet de changer son URL ; BROWSER_PATH peut pointer vers Chrome ou Edge installé. Sinon installer Chromium avec Playwright. Les captures et le rapport WCAG sont enregistrés dans artifacts, hors Git.
