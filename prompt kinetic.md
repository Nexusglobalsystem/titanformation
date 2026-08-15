# Prompt d'amorçage — Titan Kinetic

> Document autonome, à coller dans Claude Code au démarrage du projet. Le schéma
> de base de données complet est en **annexe A**, à la fin de ce document : rien
> d'autre n'est nécessaire. Une fois le lot 1 livré, les sections 1 à 7 sont à
> recopier dans un `CLAUDE.md` pour être rechargées à chaque session.

---

## 1. Contexte

Tu construis **Titan Kinetic**, un LMS destiné à un organisme de formation français
certifié **Qualiopi**. La conformité au Référentiel National Qualité n'est pas une
fonctionnalité annexe : c'est la contrainte structurante du produit. Chaque écran
doit produire une **preuve d'audit** exploitable.

Publics : apprenants particuliers, apprenants salariés d'entreprises clientes,
formateurs, gestionnaires de l'organisme, administrateurs.

Modalités pédagogiques : **blended** — classes virtuelles en direct (LiveKit) +
modules asynchrones (vidéos et quiz produits en interne, pas de SCORM).

Financement : paiement CB en ligne (particuliers) **et** devis / convention /
facture / OPCO (entreprises), y compris en subrogation.

## 2. Stack imposée

- **Base & auth** : Supabase (Postgres, Auth, Storage, Edge Functions, Realtime),
  région UE obligatoire (RGPD).
- **Web** : Next.js (App Router) + TypeScript strict + Tailwind.
- **Mobile** : Expo / React Native, partageant la couche données avec le web.
- **Emails** : Resend, avec webhooks branchés.
- **Visio** : LiveKit (SDK web + React Native), Egress pour l'enregistrement.
- **Paiement** : Stripe (Checkout pour le B2C, hors ligne pour le B2B).
- **Vidéo asynchrone** : Mux, Cloudflare Stream ou Bunny Stream — **jamais**
  Supabase Storage (pas de transcodage, pas de HLS, coûts de sortie élevés).
  Supabase Storage sert les PDF, supports et pièces justificatives.

Ne propose pas de remplacer un élément de cette liste. Si tu identifies un
problème avec l'un d'eux, signale-le et attends une décision.

## 3. Structure du dépôt

Monorepo Turborepo + pnpm :

```
apps/
  web/            Next.js — site public, espaces apprenant / formateur / entreprise / admin
  mobile/         Expo — espaces apprenant et formateur uniquement
packages/
  core/           types générés Supabase, clients, schémas Zod, logique métier partagée
  ui/             design system partagé (primitives + tokens)
supabase/
  migrations/     migrations SQL versionnées
  functions/      Edge Functions (webhooks, correction de quiz, génération documentaire)
```

Les types Postgres sont générés (`supabase gen types typescript`) et committés
dans `packages/core`. Aucun type de table écrit à la main.

## 4. Design system

Charte premium et institutionnelle :

- Bleu marine `#003366` — couleur primaire, structure et navigation
- Or `#D4AF37` — accent, réservé aux actions clés et aux états de réussite ;
  jamais en aplat sur de grandes surfaces, jamais pour du texte courant
- Mode sombre natif, piloté par `prefers-color-scheme`, tokens sémantiques
  (`--color-surface`, `--color-accent`…) et non couleurs codées en dur
- Responsive intégral : les gestionnaires travaillent sur desktop, les apprenants
  et formateurs majoritairement sur mobile
- Accessibilité RGAA : contraste AA minimum, navigation clavier complète, libellés
  ARIA. L'accessibilité est aussi un sujet Qualiopi (indicateur 9), pas seulement
  une bonne pratique.

L'or sur le bleu marine passe difficilement le contraste AA en petit texte :
vérifie chaque combinaison et propose une variante d'or désaturée si nécessaire.

### Écrans de référence — maquettes Stitch

Les maquettes de l'application sont dans `/design/screens/` (exports Stitch, un
fichier par écran, nommé d'après la route qu'il représente).

**Ces maquettes font foi. Tu dois les respecter à la lettre.** Avant d'implémenter
un écran, ouvre la maquette correspondante et reproduis fidèlement :

- la hiérarchie visuelle et la composition (grille, gouttières, marges, densité)
- l'échelle typographique : tailles, graisses, interlignage, casse
- l'usage exact des couleurs, y compris la répartition entre marine et or
- les états des composants : repos, survol, focus, actif, désactivé, chargement,
  vide, erreur
- les rayons, ombres, bordures et espacements
- la position et l'intitulé exact de chaque action

Tu n'inventes pas de composant, tu ne réorganises pas une mise en page, tu ne
remplaces pas une icône ou un libellé par ce qui te semble plus élégant. Tu ne
substitues pas une bibliothèque de composants tierce à ce qui est maquetté.

Extrais d'abord les constantes des maquettes vers les tokens de `packages/ui`
(couleurs, échelle typographique, échelle d'espacement, rayons), puis construis
les écrans à partir de ces tokens. Aucune valeur codée en dur dans un écran.

Deux cas où tu dois t'écarter de la maquette, en le signalant explicitement :

1. **Contraste ou accessibilité insuffisants.** Le RGAA prime. Propose la
   correction minimale et attends validation.
2. **Écran manquant ou état non maquetté** — vide, erreur, chargement, variante
   mobile absente. Extrapole dans le langage visuel des maquettes existantes,
   liste ce que tu as inventé en fin de tâche pour arbitrage.

Si `/design/screens/` est vide ou ne contient pas l'écran demandé, ne devine pas :
demande-le-moi.

## 5. Modèle de données

Le schéma complet figure en **annexe A** de ce document : 30 tables, les policies
RLS pour les cinq rôles, les triggers. **Lis-le intégralement avant d'écrire la
moindre ligne de code.** Il fait autorité sur toute autre indication.

Copie-le tel quel dans `supabase/migrations/00000000000000_init.sql` et applique-le
comme première migration. N'en modifie pas le contenu au passage : si un point te
paraît devoir changer, signale-le et attends validation.

Ensuite, toute évolution passe par une **nouvelle** migration — ne modifie jamais
une migration déjà appliquée.

Deux ensembles restent à modéliser, tu les proposeras avant de les implémenter :

1. **Pipeline d'admission** : candidatures, étapes, statuts, pièces demandées,
   décision, conversion en inscription.
2. **Assistant IA** : conversations, messages, sources citées, consommation de
   tokens par utilisateur.

## 6. Règles non négociables

Ces points sont des invariants. Si une demande les contredit, signale le conflit
plutôt que de contourner.

**Sécurité**
- RLS activée sur toutes les tables, sans exception. Aucune table publique.
- Les rôles vivent dans `user_roles`, jamais dans un champ modifiable par le
  client. Aucune autorisation ne repose sur une vérification côté front seul.
- `question_options.is_correct` n'est jamais exposé au client. La correction des
  quiz passe par une Edge Function en `service_role`.
- Les fichiers de Storage sont servis par URL signée courte durée, après
  vérification de l'inscription.
- Aucune clé de service dans le code client. `NEXT_PUBLIC_` uniquement pour
  l'URL Supabase et la clé publiable.

**Qualiopi et traçabilité**
- Le programme est figé dans `enrollments.program_snapshot` au moment de
  l'inscription. Un audit peut porter sur une formation modifiée depuis.
- Toute action sur une inscription, un émargement ou un document alimente
  `audit_log`.
- Un émargement signé est immuable (trigger déjà en place). Seul un gestionnaire
  peut corriger, et la correction est journalisée.
- La présence asynchrone se mesure en temps réel de connexion (heartbeat 30 s
  vers `media_events`), pas en « vu / non vu ».
- Les webhooks Resend alimentent `notifications_log` : une convocation envoyée
  est une pièce d'audit.

**Métier**
- Contrat avec un particulier : délai de rétractation de 10 jours et encaissement
  plafonné à 30 % avant son expiration (art. L6353-5 et suivants). À appliquer
  dans la logique de paiement, pas seulement dans les CGV.
- En subrogation, la facture est adressée à l'OPCO, et le certificat de
  réalisation doit être généré et signé avant l'appel de fonds.
- Le responsable entreprise voit l'assiduité de ses salariés, jamais le détail
  nominatif de leurs évaluations à chaud. Les vues agrégées imposent un seuil
  minimum de 5 répondants.

## 7. Conventions de travail

- TypeScript strict, pas de `any`.
- Validation Zod à chaque frontière (formulaires, Server Actions, webhooks).
- Server Components par défaut ; `"use client"` seulement quand c'est nécessaire.
- Mutations via Server Actions, pas de routes API sauf pour les webhooks.
- Vitest sur la logique métier, Playwright sur les parcours critiques
  (inscription, paiement, émargement).
- Tests **obligatoires** sur les policies RLS : pour chaque table sensible, un
  test qui vérifie qu'un rôle non autorisé n'y accède pas. C'est le point le plus
  fragile de l'architecture.
- Commits atomiques et conventionnels. Pas de commit qui touche cinq domaines.
- Interface, contenus, messages d'erreur et commentaires en français.

## 8. Lot 1 — ce que je te demande maintenant

**Ne va pas au-delà de ce périmètre.** Ne commence aucun autre module.

1. Initialise le monorepo (Turborepo + pnpm) avec la structure de la section 3.
2. Configure Supabase en local, applique l'annexe A comme première migration
   (`supabase/migrations/00000000000000_init.sql`), génère les types.
3. Mets en place le design system dans `packages/ui`, **par extraction des
   maquettes `/design/screens/`** et non par invention : tokens clair/sombre,
   primitives (Button, Input, Select, Card, Badge, Table, Dialog, Toast),
   typographie. Une page de démonstration montrant chaque primitive dans les deux
   thèmes, à comparer visuellement aux maquettes.
4. Implémente l'authentification web : inscription, connexion, mot de passe
   oublié, vérification d'email, déconnexion.
5. Implémente le routage par rôle avec un middleware : `/admin`, `/formateur`,
   `/entreprise`, `/apprenant`. Un utilisateur qui vise un espace interdit est
   redirigé, jamais servi partiellement.
6. Écris les tests RLS des tables `profiles`, `user_roles`, `enrollments`,
   `attendances`.
7. Fournis un `README.md` d'installation et un script de seed créant un jeu de
   données de démonstration : un admin, un gestionnaire, deux formateurs, une
   entreprise avec responsable et trois salariés, cinq apprenants particuliers,
   deux formations publiées et une session à venir.

**Critères d'acceptation** : `pnpm dev` démarre, `pnpm test` passe, les cinq rôles
du seed se connectent et atterrissent chacun sur leur espace, un apprenant qui
force l'URL `/admin` est redirigé, et chaque écran livré est visuellement
superposable à sa maquette Stitch.

## 9. Comment procéder

Commence par **lire l'annexe A en entier** et **parcourir toutes les maquettes de
`/design/screens/`**, puis expose-moi ton plan
d'exécution en attendant ma validation avant d'écrire du code.

Si un point de la spécification est ambigu ou te paraît contradictoire, pose la
question — n'invente pas de règle métier. Sur un produit soumis à audit, une
hypothèse silencieuse coûte plus cher qu'une question.

---

## Annexe A — Schéma de base de données (migration initiale)

À copier intégralement dans `supabase/migrations/00000000000000_init.sql`.

```sql
-- =====================================================================
-- Plateforme de formation certifiée Qualiopi — schéma Supabase
-- Mono-organisme · blended (live LiveKit + vidéo/quiz internes)
-- Paiement CB (Stripe) + devis/facture/OPCO
-- =====================================================================
-- À exécuter comme migration Supabase (supabase migration new schema_init)
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =====================================================================
-- 1. ÉNUMÉRATIONS
-- =====================================================================

create type app_role as enum (
  'admin',            -- accès total, gestion des rôles
  'gestionnaire',     -- back-office pédagogique et administratif
  'formateur',
  'responsable_entreprise',
  'apprenant'
);

create type company_member_role as enum ('responsable', 'salarie');

create type lesson_type as enum ('video', 'quiz', 'document', 'live_slot', 'texte');

create type session_status as enum ('brouillon', 'ouverte', 'complete', 'en_cours', 'terminee', 'annulee');

create type enrollment_status as enum (
  'preinscrit',       -- panier / demande envoyée
  'en_attente_paiement',
  'confirme',
  'annule',
  'termine',
  'abandonne'
);

create type funding_type as enum ('particulier_cb', 'entreprise_directe', 'opco', 'cpf', 'france_travail', 'interne');

create type document_type as enum (
  'programme',
  'convention',              -- B2B
  'contrat',                 -- particulier (délai de rétractation 10 j)
  'convocation',
  'feuille_emargement',
  'certificat_realisation',  -- exigé par l'OPCO avant paiement
  'attestation_fin_formation',
  'evaluation_synthese',
  'autre'
);

create type evaluation_kind as enum ('positionnement', 'satisfaction_chaud', 'satisfaction_froid', 'acquis');

create type claim_status as enum ('ouverte', 'en_cours', 'resolue', 'refusee');

create type order_status as enum ('devis', 'en_attente_paiement', 'payee', 'facturee', 'annulee', 'remboursee');

create type watch_kind as enum ('legale', 'metier', 'innovation_pedagogique', 'handicap');

-- =====================================================================
-- 2. UTILISATEURS, RÔLES, ENTREPRISES
-- =====================================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         citext not null,
  first_name    text,
  last_name     text,
  phone         text,
  -- Accessibilité : indicateur 9 du RNQ
  accessibility_needs   text,
  accessibility_flagged boolean not null default false,
  rgpd_consent_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Rôles en table dédiée : un utilisateur peut être formateur ET apprenant.
-- Ne JAMAIS stocker le rôle dans profiles côté client (élévation triviale).
create table user_roles (
  user_id   uuid not null references profiles(id) on delete cascade,
  role      app_role not null,
  granted_by uuid references profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Référents Qualiopi (ind. 9 handicap, ind. 12/13 pédagogique et technique)
create table staff_functions (
  user_id   uuid not null references profiles(id) on delete cascade,
  function  text not null check (function in ('referent_handicap','referent_pedagogique','support_technique','referent_qualite')),
  primary key (user_id, function)
);

create table companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  siret         text unique,
  vat_number    text,
  address_line1 text,
  address_line2 text,
  postal_code   text,
  city          text,
  country       text not null default 'FR',
  opco_name     text,
  billing_email citext,
  created_at    timestamptz not null default now()
);

create table company_members (
  company_id  uuid not null references companies(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        company_member_role not null default 'salarie',
  created_at  timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index on company_members (user_id);

-- Preuves de compétence formateur : indicateurs 21 et 22
create table trainer_credentials (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references profiles(id) on delete cascade,
  label       text not null,           -- « CV 2026 », « Diplôme X », « Attestation Y »
  issued_at   date,
  expires_at  date,
  storage_path text not null,          -- Supabase Storage, bucket privé
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- 3. FONCTIONS HELPER POUR LES POLICIES
-- security definer + search_path figé = obligatoire, sinon récursion RLS
-- =====================================================================

create or replace function public.has_role(target app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = target
  );
$$;

-- Personnel de l'organisme (admin ou gestionnaire)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin','gestionnaire')
  );
$$;

-- Entreprises dont l'utilisateur est responsable
create or replace function public.managed_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.company_id from company_members cm
  where cm.user_id = (select auth.uid()) and cm.role = 'responsable';
$$;

-- Sessions animées par l'utilisateur
create or replace function public.trained_session_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select st.session_id from session_trainers st
  where st.trainer_id = (select auth.uid());
$$;

-- Sessions où l'utilisateur est inscrit et confirmé
create or replace function public.enrolled_session_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.session_id from enrollments e
  where e.learner_id = (select auth.uid())
    and e.status in ('confirme','en_cours','termine');
$$;

-- =====================================================================
-- 4. CATALOGUE — indicateur 1 : information exhaustive du public
-- Les champs NOT NULL ci-dessous sont ceux que l'auditeur vérifie.
-- =====================================================================

create table trainings (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null,
  summary               text not null,
  -- Bloc Qualiopi indicateur 1
  objectives            text not null,          -- objectifs opérationnels et évaluables (ind. 2)
  prerequisites         text not null,          -- « aucun » est une réponse valable, NULL non
  target_audience       text not null,
  duration_hours        numeric(6,2) not null check (duration_hours > 0),
  duration_days         numeric(5,2),
  price_ht              numeric(10,2) not null,
  vat_rate              numeric(4,2) not null default 0,   -- exonération art. 261-4-4 a CGI fréquente
  modalities            text not null,          -- distanciel synchrone, blended...
  access_delay          text not null,          -- délai d'accès (ind. 1)
  pedagogical_means     text not null,          -- ind. 5
  assessment_methods    text not null,          -- ind. 11
  accessibility_info    text not null,          -- ind. 9 : modalités handicap + contact référent
  -- Indicateurs de résultats publiés (ind. 2 / 3)
  satisfaction_rate     numeric(5,2),
  success_rate          numeric(5,2),
  stats_updated_at      date,
  is_certifying         boolean not null default false,
  certification_name    text,
  rncp_code             text,
  status                text not null default 'brouillon' check (status in ('brouillon','publiee','archivee')),
  published_at          timestamptz,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on trainings (status);

-- Versionnement : un audit peut porter sur un programme d'il y a 18 mois.
-- On fige le programme au moment de l'inscription (cf. enrollments.program_snapshot).

create table modules (
  id            uuid primary key default gen_random_uuid(),
  training_id   uuid not null references trainings(id) on delete cascade,
  title         text not null,
  description   text,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);

create index on modules (training_id, position);

create table lessons (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references modules(id) on delete cascade,
  title         text not null,
  type          lesson_type not null,
  position      int not null default 0,
  -- Durée déclarée : c'est ce qui justifie le volume horaire annoncé (ind. 5)
  duration_minutes int not null default 0,
  -- Vidéo : identifiant chez le prestataire de streaming (Mux / Cloudflare Stream /
  -- Bunny). NE PAS servir la vidéo depuis Supabase Storage : pas de transcodage,
  -- pas de HLS, coûts de sortie élevés.
  video_provider   text,
  video_asset_id   text,
  document_path    text,          -- Supabase Storage, bucket privé
  body             text,          -- contenu riche pour type = 'texte'
  is_mandatory     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index on lessons (module_id, position);

-- =====================================================================
-- 5. QUIZ — banque de questions réutilisable
-- =====================================================================

create table questions (
  id            uuid primary key default gen_random_uuid(),
  training_id   uuid references trainings(id) on delete set null,  -- null = banque transverse
  statement     text not null,
  kind          text not null default 'qcm' check (kind in ('qcm','qcu','vrai_faux','texte_libre')),
  explanation   text,                                   -- feedback pédagogique
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table question_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references questions(id) on delete cascade,
  label         text not null,
  is_correct    boolean not null default false,
  position      int not null default 0
);

create table quizzes (
  id                uuid primary key default gen_random_uuid(),
  lesson_id         uuid not null unique references lessons(id) on delete cascade,
  pass_threshold    numeric(5,2) not null default 70,
  max_attempts      int,                       -- null = illimité
  shuffle_questions boolean not null default true,
  questions_drawn   int,                       -- tirage aléatoire ; null = toutes
  time_limit_minutes int
);

create table quiz_items (
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position    int not null default 0,
  points      numeric(5,2) not null default 1,
  primary key (quiz_id, question_id)
);

-- =====================================================================
-- 6. SESSIONS ET PLANNING
-- =====================================================================

create table sessions (
  id              uuid primary key default gen_random_uuid(),
  training_id     uuid not null references trainings(id) on delete restrict,
  reference       text not null unique,          -- ex. « FORM-2026-014 », utile en audit
  status          session_status not null default 'brouillon',
  starts_on       date not null,
  ends_on         date not null,
  min_seats       int not null default 1,
  max_seats       int not null default 12,
  price_ht_override numeric(10,2),
  livekit_room_name text unique,
  created_at      timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index on sessions (training_id, starts_on);

create table session_trainers (
  session_id  uuid not null references sessions(id) on delete cascade,
  trainer_id  uuid not null references profiles(id) on delete restrict,
  is_lead     boolean not null default false,
  primary key (session_id, trainer_id)
);

-- Créneaux : granularité demi-journée, base légale de l'émargement
create table session_slots (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  slot_date     date not null,
  half_day      text not null check (half_day in ('matin','apres_midi')),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  livekit_room_name text,
  recording_url text,                    -- LiveKit Egress ; consentement RGPD requis
  trainer_signed_at timestamptz,
  trainer_signature_path text,
  unique (session_id, slot_date, half_day)
);

create index on session_slots (session_id, starts_at);

-- =====================================================================
-- 7. INSCRIPTIONS ET FINANCEMENT
-- =====================================================================

create table enrollments (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete restrict,
  learner_id      uuid not null references profiles(id) on delete restrict,
  company_id      uuid references companies(id) on delete set null,  -- null = particulier
  status          enrollment_status not null default 'preinscrit',
  funding         funding_type not null,
  opco_name       text,
  opco_dossier_number text,
  subrogation     boolean not null default false,   -- l'OPCO paie directement l'organisme
  -- Particulier : art. L6353-5 — 10 jours de rétractation, encaissement plafonné à 30 %
  contract_signed_at    timestamptz,
  withdrawal_deadline   timestamptz,
  withdrawn_at          timestamptz,
  -- Programme figé au moment de l'inscription : preuve d'audit
  program_snapshot      jsonb,
  positioning_done_at   timestamptz,        -- ind. 4 : positionnement à l'entrée
  completed_at          timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (session_id, learner_id)
);

create index on enrollments (learner_id);
create index on enrollments (company_id);
create index on enrollments (session_id, status);

-- =====================================================================
-- 8. PRÉSENCE — deux natures de preuve
-- =====================================================================

-- 8a. Live : émargement par demi-journée
create table attendances (
  id              uuid primary key default gen_random_uuid(),
  slot_id         uuid not null references session_slots(id) on delete cascade,
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  present         boolean,
  absence_reason  text,
  -- Signature apprenant : canvas + horodatage + IP suffit pour la plupart des OPCO ;
  -- passer à Yousign/Docuseal si signature eIDAS avancée exigée.
  signed_at       timestamptz,
  signature_path  text,
  signature_ip    inet,
  -- Preuve technique automatique issue des webhooks LiveKit
  livekit_joined_at   timestamptz,
  livekit_left_at     timestamptz,
  livekit_duration_s  int not null default 0,
  unique (slot_id, enrollment_id)
);

create index on attendances (enrollment_id);

-- 8b. Asynchrone : la présence se prouve par le temps de connexion réel.
-- Heartbeat toutes les 30 s côté client, agrégé ici. « Vu / non vu » ne suffit pas.
create table learner_progress (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  started_at      timestamptz,
  completed_at    timestamptz,
  time_spent_s    int not null default 0,
  last_position_s int not null default 0,     -- reprise de lecture vidéo
  updated_at      timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

create table media_events (
  id              bigserial primary key,
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  event           text not null check (event in ('play','pause','heartbeat','ended','seek')),
  position_s      int not null default 0,
  occurred_at     timestamptz not null default now()
);

create index on media_events (enrollment_id, lesson_id, occurred_at);

create table quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references quizzes(id) on delete cascade,
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  attempt_number  int not null default 1,
  score           numeric(5,2),
  max_score       numeric(5,2),
  passed          boolean,
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  unique (quiz_id, enrollment_id, attempt_number)
);

create table quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references quiz_attempts(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete cascade,
  selected_option_ids uuid[],
  free_text       text,
  is_correct      boolean,
  points_awarded  numeric(5,2) not null default 0
);

-- =====================================================================
-- 9. ÉVALUATIONS, RÉCLAMATIONS, VEILLE
-- =====================================================================

create table evaluation_forms (
  id            uuid primary key default gen_random_uuid(),
  kind          evaluation_kind not null,
  training_id   uuid references trainings(id) on delete cascade,  -- null = formulaire générique
  title         text not null,
  schema        jsonb not null,        -- définition des questions
  -- Déclenchement automatique : ind. 30 (à froid, typiquement J+60 ou J+90)
  trigger_offset_days int,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table evaluation_responses (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid not null references evaluation_forms(id) on delete restrict,
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  respondent_id   uuid references profiles(id),
  answers         jsonb not null,
  score           numeric(5,2),
  submitted_at    timestamptz not null default now(),
  unique (form_id, enrollment_id)
);

-- Indicateur 31 : traitement tracé des réclamations, avec délai
create table claims (
  id              uuid primary key default gen_random_uuid(),
  submitted_by    uuid references profiles(id) on delete set null,
  enrollment_id   uuid references enrollments(id) on delete set null,
  subject         text not null,
  body            text not null,
  status          claim_status not null default 'ouverte',
  assigned_to     uuid references profiles(id),
  resolution      text,
  corrective_action text,               -- ind. 32 : amélioration continue
  submitted_at    timestamptz not null default now(),
  resolved_at     timestamptz
);

-- Indicateurs 23 à 26 : veille légale, métier, pédagogique, handicap
create table watch_entries (
  id            uuid primary key default gen_random_uuid(),
  kind          watch_kind not null,
  title         text not null,
  source_url    text,
  summary       text,
  impact        text,                  -- conséquence sur l'offre : ce que l'auditeur lit
  recorded_by   uuid references profiles(id),
  recorded_at   date not null default current_date
);

-- =====================================================================
-- 10. DOCUMENTS, COMMANDES, FACTURATION, LOGS
-- =====================================================================

create table documents (
  id              uuid primary key default gen_random_uuid(),
  type            document_type not null,
  enrollment_id   uuid references enrollments(id) on delete cascade,
  session_id      uuid references sessions(id) on delete cascade,
  company_id      uuid references companies(id) on delete cascade,
  storage_path    text not null,
  version         int not null default 1,
  generated_at    timestamptz not null default now(),
  signed_at       timestamptz,
  check (enrollment_id is not null or session_id is not null or company_id is not null)
);

create index on documents (enrollment_id, type);

create table orders (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  company_id      uuid references companies(id) on delete set null,
  buyer_id        uuid references profiles(id) on delete set null,
  funding         funding_type not null,
  status          order_status not null default 'devis',
  total_ht        numeric(10,2) not null default 0,
  total_vat       numeric(10,2) not null default 0,
  total_ttc       numeric(10,2) not null default 0,
  stripe_session_id text,
  stripe_payment_intent_id text,
  quote_valid_until date,
  created_at      timestamptz not null default now()
);

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  enrollment_id   uuid references enrollments(id) on delete set null,
  label           text not null,
  quantity        int not null default 1,
  unit_price_ht   numeric(10,2) not null,
  vat_rate        numeric(4,2) not null default 0
);

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete restrict,
  number          text not null unique,        -- numérotation continue obligatoire
  issued_on       date not null default current_date,
  due_on          date,
  paid_at         timestamptz,
  -- Subrogation : le destinataire de la facture est l'OPCO, pas le client
  billed_to       text not null,
  storage_path    text
);

-- Preuve d'envoi : les webhooks Resend alimentent cette table.
-- Une convocation envoyée est une pièce d'audit.
create table notifications_log (
  id              bigserial primary key,
  resend_id       text,
  template        text not null,
  recipient       citext not null,
  enrollment_id   uuid references enrollments(id) on delete set null,
  status          text not null default 'queued',   -- queued|sent|delivered|opened|bounced|complained
  sent_at         timestamptz not null default now(),
  delivered_at    timestamptz,
  opened_at       timestamptz,
  error           text
);

create index on notifications_log (enrollment_id);

-- Journal d'audit : exigé de fait par Qualiopi ET par le RGPD
create table audit_log (
  id              bigserial primary key,
  actor_id        uuid references profiles(id) on delete set null,
  action          text not null,
  entity          text not null,
  entity_id       uuid,
  diff            jsonb,
  ip              inet,
  occurred_at     timestamptz not null default now()
);

create index on audit_log (entity, entity_id, occurred_at);

-- =====================================================================
-- 11. ROW LEVEL SECURITY
-- =====================================================================

alter table profiles              enable row level security;
alter table user_roles            enable row level security;
alter table staff_functions       enable row level security;
alter table companies             enable row level security;
alter table company_members       enable row level security;
alter table trainer_credentials   enable row level security;
alter table trainings             enable row level security;
alter table modules               enable row level security;
alter table lessons               enable row level security;
alter table questions             enable row level security;
alter table question_options      enable row level security;
alter table quizzes               enable row level security;
alter table quiz_items            enable row level security;
alter table sessions              enable row level security;
alter table session_trainers      enable row level security;
alter table session_slots         enable row level security;
alter table enrollments           enable row level security;
alter table attendances           enable row level security;
alter table learner_progress      enable row level security;
alter table media_events          enable row level security;
alter table quiz_attempts         enable row level security;
alter table quiz_answers          enable row level security;
alter table evaluation_forms      enable row level security;
alter table evaluation_responses  enable row level security;
alter table claims                enable row level security;
alter table watch_entries         enable row level security;
alter table documents             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table invoices              enable row level security;
alter table notifications_log     enable row level security;
alter table audit_log             enable row level security;

-- ---- Profils -------------------------------------------------------
create policy "profil lisible par soi" on profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profil modifiable par soi" on profiles
  for update to authenticated using (id = (select auth.uid()));

create policy "profils lisibles par le staff" on profiles
  for select to authenticated using (is_staff());

create policy "staff gere les profils" on profiles
  for all to authenticated using (is_staff()) with check (is_staff());

-- Le formateur voit les profils de ses apprenants uniquement
create policy "formateur voit ses apprenants" on profiles
  for select to authenticated using (
    exists (
      select 1 from enrollments e
      where e.learner_id = profiles.id
        and e.session_id in (select trained_session_ids())
    )
  );

-- ---- Rôles : lecture pour soi, écriture admin seul -----------------
create policy "voir ses roles" on user_roles
  for select to authenticated using (user_id = (select auth.uid()) or is_staff());

create policy "admin gere les roles" on user_roles
  for all to authenticated using (has_role('admin')) with check (has_role('admin'));

create policy "fonctions staff lisibles" on staff_functions
  for select to authenticated using (true);
create policy "admin gere fonctions staff" on staff_functions
  for all to authenticated using (has_role('admin')) with check (has_role('admin'));

-- ---- Entreprises ---------------------------------------------------
create policy "staff gere les entreprises" on companies
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "membre voit son entreprise" on companies
  for select to authenticated using (
    exists (select 1 from company_members cm
            where cm.company_id = companies.id and cm.user_id = (select auth.uid()))
  );

create policy "staff gere les membres" on company_members
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "voir les membres de son entreprise" on company_members
  for select to authenticated using (
    user_id = (select auth.uid()) or company_id in (select managed_company_ids())
  );

create policy "responsable ajoute ses salaries" on company_members
  for insert to authenticated
  with check (company_id in (select managed_company_ids()) and role = 'salarie');

-- ---- Preuves de compétence formateur -------------------------------
create policy "formateur gere ses preuves" on trainer_credentials
  for all to authenticated
  using (trainer_id = (select auth.uid()) or is_staff())
  with check (trainer_id = (select auth.uid()) or is_staff());

-- ---- Catalogue : public en lecture si publié -----------------------
create policy "catalogue publie lisible par tous" on trainings
  for select to anon, authenticated using (status = 'publiee');

create policy "staff gere le catalogue" on trainings
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "formateur lit le catalogue" on trainings
  for select to authenticated using (has_role('formateur'));

-- ---- Contenus : visibles si inscrit, ou staff/formateur ------------
create policy "staff gere les modules" on modules
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "modules visibles si inscrit ou formateur" on modules
  for select to authenticated using (
    has_role('formateur')
    or exists (
      select 1 from sessions s
      where s.training_id = modules.training_id
        and s.id in (select enrolled_session_ids())
    )
  );

create policy "staff gere les lecons" on lessons
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "lecons visibles si module visible" on lessons
  for select to authenticated using (
    has_role('formateur')
    or exists (
      select 1 from modules m
      join sessions s on s.training_id = m.training_id
      where m.id = lessons.module_id and s.id in (select enrolled_session_ids())
    )
  );

-- ---- Quiz : l'apprenant ne doit JAMAIS lire question_options.is_correct.
-- On coupe l'accès direct : la correction passe par une Edge Function
-- (service_role) qui reçoit les réponses et renvoie le score.
create policy "staff et formateur gerent les questions" on questions
  for all to authenticated
  using (is_staff() or has_role('formateur'))
  with check (is_staff() or has_role('formateur'));

create policy "staff et formateur gerent les options" on question_options
  for all to authenticated
  using (is_staff() or has_role('formateur'))
  with check (is_staff() or has_role('formateur'));

create policy "staff gere les quiz" on quizzes
  for all to authenticated using (is_staff()) with check (is_staff());
create policy "quiz lisible si inscrit" on quizzes
  for select to authenticated using (
    exists (select 1 from lessons l join modules m on m.id = l.module_id
            join sessions s on s.training_id = m.training_id
            where l.id = quizzes.lesson_id and s.id in (select enrolled_session_ids()))
  );

create policy "staff gere les items de quiz" on quiz_items
  for all to authenticated using (is_staff()) with check (is_staff());

-- ---- Sessions ------------------------------------------------------
create policy "sessions ouvertes visibles publiquement" on sessions
  for select to anon, authenticated using (status in ('ouverte','complete'));

create policy "staff gere les sessions" on sessions
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "formateur voit ses sessions" on sessions
  for select to authenticated using (id in (select trained_session_ids()));

create policy "apprenant voit ses sessions" on sessions
  for select to authenticated using (id in (select enrolled_session_ids()));

create policy "responsable voit les sessions de ses salaries" on sessions
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.session_id = sessions.id
              and e.company_id in (select managed_company_ids()))
  );

create policy "staff gere les affectations formateur" on session_trainers
  for all to authenticated using (is_staff()) with check (is_staff());
create policy "formateur voit ses affectations" on session_trainers
  for select to authenticated using (trainer_id = (select auth.uid()));

create policy "staff gere les creneaux" on session_slots
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "creneaux visibles aux participants" on session_slots
  for select to authenticated using (
    session_id in (select trained_session_ids())
    or session_id in (select enrolled_session_ids())
  );

create policy "formateur signe son creneau" on session_slots
  for update to authenticated
  using (session_id in (select trained_session_ids()))
  with check (session_id in (select trained_session_ids()));

-- ---- Inscriptions --------------------------------------------------
create policy "staff gere les inscriptions" on enrollments
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "apprenant voit ses inscriptions" on enrollments
  for select to authenticated using (learner_id = (select auth.uid()));

create policy "apprenant s inscrit lui meme" on enrollments
  for insert to authenticated
  with check (learner_id = (select auth.uid()) and status = 'preinscrit');

create policy "responsable gere les inscriptions de ses salaries" on enrollments
  for all to authenticated
  using (company_id in (select managed_company_ids()))
  with check (company_id in (select managed_company_ids()));

create policy "formateur voit les inscrits de ses sessions" on enrollments
  for select to authenticated using (session_id in (select trained_session_ids()));

-- ---- Émargement ----------------------------------------------------
create policy "staff gere les emargements" on attendances
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "apprenant voit son emargement" on attendances
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.id = attendances.enrollment_id and e.learner_id = (select auth.uid()))
  );

-- L'apprenant signe pour lui-même. Un trigger empêche la re-signature.
create policy "apprenant signe pour lui" on attendances
  for update to authenticated
  using (exists (select 1 from enrollments e
                 where e.id = attendances.enrollment_id and e.learner_id = (select auth.uid())))
  with check (exists (select 1 from enrollments e
                      where e.id = attendances.enrollment_id and e.learner_id = (select auth.uid())));

create policy "formateur gere l emargement de ses creneaux" on attendances
  for all to authenticated
  using (exists (select 1 from session_slots ss
                 where ss.id = attendances.slot_id and ss.session_id in (select trained_session_ids())))
  with check (exists (select 1 from session_slots ss
                      where ss.id = attendances.slot_id and ss.session_id in (select trained_session_ids())));

create or replace function public.lock_signed_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.signed_at is not null and not is_staff() then
    raise exception 'Émargement déjà signé : modification interdite';
  end if;
  return new;
end;
$$;

create trigger trg_lock_signed_attendance
  before update on attendances
  for each row execute function public.lock_signed_attendance();

-- ---- Progression et quiz ------------------------------------------
create policy "apprenant gere sa progression" on learner_progress
  for all to authenticated
  using (exists (select 1 from enrollments e
                 where e.id = learner_progress.enrollment_id and e.learner_id = (select auth.uid())))
  with check (exists (select 1 from enrollments e
                      where e.id = learner_progress.enrollment_id and e.learner_id = (select auth.uid())));

create policy "staff et formateur voient la progression" on learner_progress
  for select to authenticated using (
    is_staff()
    or exists (select 1 from enrollments e
               where e.id = learner_progress.enrollment_id
                 and e.session_id in (select trained_session_ids()))
  );

-- Le responsable entreprise voit l'assiduité agrégée, pas le détail des réponses
create policy "responsable voit la progression de ses salaries" on learner_progress
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.id = learner_progress.enrollment_id
              and e.company_id in (select managed_company_ids()))
  );

create policy "apprenant ecrit ses evenements media" on media_events
  for insert to authenticated
  with check (exists (select 1 from enrollments e
                      where e.id = media_events.enrollment_id and e.learner_id = (select auth.uid())));

create policy "staff lit les evenements media" on media_events
  for select to authenticated using (is_staff());

create policy "apprenant voit ses tentatives" on quiz_attempts
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.id = quiz_attempts.enrollment_id and e.learner_id = (select auth.uid()))
  );

create policy "staff et formateur voient les tentatives" on quiz_attempts
  for select to authenticated using (
    is_staff()
    or exists (select 1 from enrollments e
               where e.id = quiz_attempts.enrollment_id
                 and e.session_id in (select trained_session_ids()))
  );
-- Insert/update des tentatives : service_role uniquement (Edge Function de correction)

create policy "voir ses reponses de quiz" on quiz_answers
  for select to authenticated using (
    exists (select 1 from quiz_attempts qa join enrollments e on e.id = qa.enrollment_id
            where qa.id = quiz_answers.attempt_id and e.learner_id = (select auth.uid()))
  );

-- ---- Évaluations ---------------------------------------------------
create policy "formulaires actifs lisibles" on evaluation_forms
  for select to authenticated using (is_active or is_staff());
create policy "staff gere les formulaires" on evaluation_forms
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "apprenant repond aux evaluations" on evaluation_responses
  for insert to authenticated
  with check (respondent_id = (select auth.uid()));

create policy "apprenant voit ses reponses" on evaluation_responses
  for select to authenticated using (respondent_id = (select auth.uid()));

create policy "staff voit les reponses" on evaluation_responses
  for select to authenticated using (is_staff());
-- Volontairement : ni le formateur ni le responsable entreprise ne lisent le
-- détail nominatif des évaluations à chaud. Ils consultent des vues agrégées
-- (à créer avec security_invoker = off et un seuil minimum de répondants).

-- ---- Réclamations --------------------------------------------------
create policy "deposer une reclamation" on claims
  for insert to authenticated with check (submitted_by = (select auth.uid()));
create policy "voir ses reclamations" on claims
  for select to authenticated using (submitted_by = (select auth.uid()) or is_staff());
create policy "staff traite les reclamations" on claims
  for update to authenticated using (is_staff()) with check (is_staff());

-- ---- Veille --------------------------------------------------------
create policy "staff gere la veille" on watch_entries
  for all to authenticated using (is_staff()) with check (is_staff());

-- ---- Documents -----------------------------------------------------
create policy "staff gere les documents" on documents
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "apprenant voit ses documents" on documents
  for select to authenticated using (
    exists (select 1 from enrollments e
            where e.id = documents.enrollment_id and e.learner_id = (select auth.uid()))
  );

create policy "responsable voit les documents de son entreprise" on documents
  for select to authenticated using (
    company_id in (select managed_company_ids())
    or exists (select 1 from enrollments e
               where e.id = documents.enrollment_id
                 and e.company_id in (select managed_company_ids()))
  );

-- ---- Commandes et factures ----------------------------------------
create policy "staff gere les commandes" on orders
  for all to authenticated using (is_staff()) with check (is_staff());
create policy "voir ses commandes" on orders
  for select to authenticated using (
    buyer_id = (select auth.uid()) or company_id in (select managed_company_ids())
  );

create policy "voir les lignes de ses commandes" on order_items
  for select to authenticated using (
    exists (select 1 from orders o where o.id = order_items.order_id
            and (o.buyer_id = (select auth.uid()) or o.company_id in (select managed_company_ids())))
  );
create policy "staff gere les lignes" on order_items
  for all to authenticated using (is_staff()) with check (is_staff());

create policy "staff gere les factures" on invoices
  for all to authenticated using (is_staff()) with check (is_staff());
create policy "voir ses factures" on invoices
  for select to authenticated using (
    exists (select 1 from orders o where o.id = invoices.order_id
            and (o.buyer_id = (select auth.uid()) or o.company_id in (select managed_company_ids())))
  );

-- ---- Journaux : staff en lecture, écriture par service_role --------
create policy "staff lit les notifications" on notifications_log
  for select to authenticated using (is_staff());

create policy "admin lit le journal d audit" on audit_log
  for select to authenticated using (has_role('admin'));

-- =====================================================================
-- 12. AUTOMATISMES
-- =====================================================================

-- Création du profil et du rôle apprenant à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name');
  insert into public.user_roles (user_id, role) values (new.id, 'apprenant');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Délai de rétractation de 10 jours pour les contrats avec un particulier
create or replace function public.set_withdrawal_deadline()
returns trigger language plpgsql as $$
begin
  if new.company_id is null and new.contract_signed_at is not null
     and new.withdrawal_deadline is null then
    new.withdrawal_deadline := new.contract_signed_at + interval '10 days';
  end if;
  return new;
end;
$$;

create trigger trg_withdrawal_deadline
  before insert or update on enrollments
  for each row execute function public.set_withdrawal_deadline();

-- Création automatique des lignes d'émargement à la confirmation d'inscription
create or replace function public.create_attendance_rows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirme' and (old.status is distinct from 'confirme') then
    insert into attendances (slot_id, enrollment_id)
    select ss.id, new.id from session_slots ss where ss.session_id = new.session_id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_create_attendance_rows
  after insert or update of status on enrollments
  for each row execute function public.create_attendance_rows();

-- =====================================================================
-- Reste à câbler côté Edge Functions / cron :
--   · webhooks LiveKit  → attendances.livekit_*
--   · webhooks Resend   → notifications_log.status
--   · webhooks Stripe   → orders.status, enrollments.status
--   · cron quotidien    → envoi des évaluations à froid (trigger_offset_days)
--   · cron quotidien    → relance des émargements et évaluations manquants
--   · correction quiz   → service_role, jamais côté client
--   · export « dossier de session » (zip) et alimentation du BPF
-- =====================================================================
```
