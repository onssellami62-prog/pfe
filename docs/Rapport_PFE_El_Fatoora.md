# RAPPORT DE PROJET DE FIN D'ÉTUDES

## Conception et Développement d'une Plateforme de Facturation Électronique Conforme au Standard TEIF — « El Fatoora »

---

**Établissement :** *(à compléter)*
**Filière :** Génie Informatique / Génie Logiciel
**Année universitaire :** 2025 – 2026

**Réalisé par :** *(à compléter)*
**Encadré par :** *(à compléter)*

---

# Table des Matières

- [Introduction Générale](#introduction-générale)
- [Chapitre 1 — Contexte, Problématique et Objectifs](#chapitre-1--contexte-problématique-et-objectifs)
  - [1.1 Contexte général](#11-contexte-général)
  - [1.2 Problématique](#12-problématique)
  - [1.3 Objectifs du projet](#13-objectifs-du-projet)
  - [1.4 Périmètre fonctionnel](#14-périmètre-fonctionnel)
  - [1.5 Méthodologie de travail](#15-méthodologie-de-travail)
- [Chapitre 2 — Analyse Fonctionnelle et Spécification des Besoins](#chapitre-2--analyse-fonctionnelle-et-spécification-des-besoins)
  - [2.1 Identification des acteurs](#21-identification-des-acteurs)
  - [2.2 Besoins fonctionnels](#22-besoins-fonctionnels)
  - [2.3 Besoins non fonctionnels](#23-besoins-non-fonctionnels)
  - [2.4 Diagramme de cas d'utilisation](#24-diagramme-de-cas-dutilisation)
  - [2.5 Description détaillée des cas d'utilisation](#25-description-détaillée-des-cas-dutilisation)
- [Chapitre 3 — Conception du Système](#chapitre-3--conception-du-système)
  - [3.1 Architecture globale de l'application](#31-architecture-globale-de-lapplication)
  - [3.2 Architecture backend (API REST)](#32-architecture-backend-api-rest)
  - [3.3 Architecture frontend (SPA React)](#33-architecture-frontend-spa-react)
  - [3.4 Conception de la base de données](#34-conception-de-la-base-de-données)
  - [3.5 Diagramme de classes UML](#35-diagramme-de-classes-uml)
  - [3.6 Diagrammes de séquence](#36-diagrammes-de-séquence)
- [Chapitre 4 — Réalisation et Implémentation](#chapitre-4--réalisation-et-implémentation)
  - [4.1 Environnement technique et outils utilisés](#41-environnement-technique-et-outils-utilisés)
  - [4.2 Module d'Authentification et Sécurité](#42-module-dauthentification-et-sécurité)
  - [4.3 Module de Gestion des Utilisateurs et des Sociétés](#43-module-de-gestion-des-utilisateurs-et-des-sociétés)
  - [4.4 Module de Gestion des Factures Électroniques](#44-module-de-gestion-des-factures-électroniques)
  - [4.5 Module de Signature Électronique XAdES-EPES](#45-module-de-signature-électronique-xades-epes)
  - [4.6 Module de Génération XML TEIF v2.0](#46-module-de-génération-xml-teif-v20)
  - [4.7 Module d'Importation OCR (PDF/Image)](#47-module-dimportation-ocr-pdfimage)
  - [4.8 Module de Statistiques et Tableau de Bord](#48-module-de-statistiques-et-tableau-de-bord)
  - [4.9 Module de Déclaration Fiscale](#49-module-de-déclaration-fiscale)
  - [4.10 Module de Journal d'Activités](#410-module-de-journal-dactivités)
  - [4.11 Interfaces utilisateur réalisées](#411-interfaces-utilisateur-réalisées)
- [Chapitre 5 — Tests, Validation et Déploiement](#chapitre-5--tests-validation-et-déploiement)
  - [5.1 Stratégie de test](#51-stratégie-de-test)
  - [5.2 Tests unitaires](#52-tests-unitaires)
  - [5.3 Tests d'intégration API](#53-tests-dintégration-api)
  - [5.4 Tests fonctionnels (end-to-end)](#54-tests-fonctionnels-end-to-end)
  - [5.5 Validation de la conformité TEIF](#55-validation-de-la-conformité-teif)
  - [5.6 Scénarios de test détaillés](#56-scénarios-de-test-détaillés)
- [Conclusion Générale et Perspectives](#conclusion-générale-et-perspectives)
- [Annexes](#annexes)

---

# Introduction Générale

La transformation digitale des processus administratifs et financiers constitue un enjeu stratégique majeur pour les économies émergentes. En Tunisie, la Direction Générale des Impôts (DGI), en partenariat avec Tunisie TradeNet (TTN), a engagé un chantier de modernisation de la facturation à travers l'introduction progressive de la **facturation électronique obligatoire** basée sur le standard **TEIF (Tunisian Electronic Invoice Format)**, un format XML structuré conforme aux normes internationales UN/CEFACT et inspiré du standard européen UBL (Universal Business Language).

Dans ce contexte, le présent projet de fin d'études (PFE) porte sur la **conception, le développement et la mise en œuvre d'une plateforme web de facturation électronique** dénommée **« El Fatoora »**. Cette application full-stack permet aux entreprises tunisiennes de créer, gérer, signer numériquement et transmettre leurs factures au format TEIF XML, en assurant la conformité avec les exigences réglementaires nationales.

L'application « El Fatoora » se distingue par plusieurs caractéristiques innovantes :

- **Génération automatique de factures au format TEIF v2.0** conforme aux spécifications TTN ;
- **Signature électronique XAdES-EPES** à l'aide de certificats numériques X.509 ;
- **Importation intelligente de factures** à partir de documents PDF et images grâce à la reconnaissance optique de caractères (OCR) ;
- **Tableau de bord statistique** avec indicateurs clés de performance (KPI) ;
- **Architecture multi-entreprises** permettant à un utilisateur de gérer plusieurs sociétés ;
- **Système d'authentification sécurisé** avec vérification OTP par e-mail.

Ce rapport est organisé en cinq chapitres. Le premier chapitre présente le contexte général, la problématique et les objectifs du projet. Le deuxième chapitre détaille l'analyse fonctionnelle et la spécification des besoins. Le troisième chapitre est consacré à la conception du système. Le quatrième chapitre décrit la réalisation et l'implémentation détaillée de chaque module. Enfin, le cinquième chapitre porte sur les tests, la validation et les perspectives d'amélioration.

---

# Chapitre 1 — Contexte, Problématique et Objectifs

## 1.1 Contexte général

### 1.1.1 La facturation électronique en Tunisie

La facturation électronique (e-facturation) désigne la création, la transmission et l'archivage de factures sous forme électronique structurée, en remplacement des factures papier traditionnelles. En Tunisie, ce processus s'inscrit dans une volonté gouvernementale de :

- **Moderniser l'administration fiscale** et réduire la fraude à la TVA ;
- **Faciliter les échanges B2B et B2G** (Business-to-Government) ;
- **Améliorer la traçabilité** des transactions commerciales ;
- **Réduire les coûts** de traitement et d'archivage des documents.

### 1.1.2 Le standard TEIF (Tunisian Electronic Invoice Format)

Le TEIF est le format officiel de facturation électronique adopté par la Tunisie. Il s'agit d'un document XML structuré selon le schéma XSD publié par la DGI, comprenant :

- **INVOICEHEADER** : identification de l'émetteur et du destinataire via le Matricule Fiscal ;
- **INVOICEBODY** : détails de la facture (BGM, DTM, partenaires, lignes, taxes, montants) ;
- **Signature numérique** : signature XML (XMLDSig) conforme au profil XAdES-EPES.

### 1.1.3 Tunisie TradeNet (TTN)

Tunisie TradeNet est l'opérateur national désigné pour la gestion de la plateforme de facturation électronique. Les entreprises doivent transmettre leurs factures signées électroniquement à TTN, qui assure la validation, l'archivage légal et la transmission aux services fiscaux.

### 1.1.4 Le Matricule Fiscal tunisien

Le Matricule Fiscal (MF) est l'identifiant unique des contribuables en Tunisie. Il obéit au format suivant (13 caractères sans séparateurs) :

| Position | Longueur | Description | Exemple |
|----------|----------|-------------|---------|
| 1-7 | 7 | Numéro séquentiel | 1234567 |
| 8 | 1 | Clé de contrôle | A |
| 9 | 1 | Code catégorie (A, P, B, M) | P |
| 10 | 1 | Code TVA | M |
| 11-13 | 3 | Code établissement secondaire | 000 |

Ce format est validé rigoureusement dans l'application à l'aide d'une expression régulière : `^\d{7}[A-Z]{3}\d{3}$`.

## 1.2 Problématique

Malgré l'existence du cadre réglementaire, de nombreuses PME et TPE tunisiennes rencontrent des difficultés majeures pour se conformer aux exigences de la facturation électronique :

1. **Complexité technique** : la génération de fichiers XML conformes au schéma XSD TEIF nécessite des compétences informatiques avancées ;
2. **Signature électronique** : l'obtention et l'utilisation de certificats numériques X.509 pour la signature XAdES-EPES restent un processus complexe ;
3. **Coût des solutions existantes** : les plateformes commerciales de facturation électronique sont souvent onéreuses et peu adaptées au tissu économique local ;
4. **Absence d'outils d'importation** : la numérisation des factures papier existantes est laborieuse sans outils d'OCR intégrés ;
5. **Manque de visibilité fiscale** : les entreprises n'ont pas d'outils simples pour suivre leur situation fiscale (TVA collectée, droit de timbre, etc.).

## 1.3 Objectifs du projet

L'objectif principal de ce PFE est de concevoir et développer une plateforme web complète et ergonomique permettant aux entreprises tunisiennes de :

1. **Créer des factures électroniques** conformes au format TEIF v2.0 via une interface intuitive ;
2. **Signer électroniquement les factures** à l'aide de certificats numériques X.509 (profil XAdES-EPES) ;
3. **Gérer un catalogue de clients et produits** avec validation automatique du Matricule Fiscal ;
4. **Importer des factures** à partir de documents PDF et images grâce à l'OCR ;
5. **Visualiser des statistiques** de facturation et des indicateurs de performance ;
6. **Préparer les déclarations fiscales** mensuelles (TVA collectée, droit de timbre) ;
7. **Administrer les utilisateurs et sociétés** avec un système de rôles et de validation ;
8. **Assurer la sécurité** via l'authentification JWT et la vérification OTP par e-mail.

## 1.4 Périmètre fonctionnel

Le tableau suivant résume les modules fonctionnels de l'application :

| Module | Description | Acteurs |
|--------|-------------|---------|
| Authentification | Login, inscription, vérification OTP, gestion JWT | Tous |
| Administration | Gestion utilisateurs, sociétés, certificats, journal d'activités | Administrateur |
| Gestion Factures | Création manuelle, importation, listing, signature, XML | Utilisateur (Client) |
| Clients & Produits | CRUD clients et produits avec validation MF | Utilisateur (Client) |
| Statistiques | KPI, évolution mensuelle, répartition TVA, top clients | Utilisateur (Client) |
| Déclaration Fiscale | Résumé mensuel TVA, droit de timbre, détail par taux | Utilisateur (Client) |
| Profil Société | Modification des informations de la société | Utilisateur (Client) |

## 1.5 Méthodologie de travail

Le développement du projet a suivi une approche **itérative et incrémentale**, inspirée des principes de la méthodologie Agile :

- **Phase 1 — Analyse** : Étude du standard TEIF, identification des besoins, spécification fonctionnelle ;
- **Phase 2 — Conception** : Architecture technique, modélisation de la base de données, conception des API ;
- **Phase 3 — Développement** : Implémentation des modules backend et frontend par sprints ;
- **Phase 4 — Tests et validation** : Tests unitaires, tests d'intégration, validation de la conformité TEIF ;
- **Phase 5 — Documentation** : Rédaction du rapport et préparation de la soutenance.

---

# Chapitre 2 — Analyse Fonctionnelle et Spécification des Besoins

## 2.1 Identification des acteurs

L'application « El Fatoora » identifie deux types d'acteurs principaux :

### 2.1.1 Administrateur (rôle : `admin`)

L'administrateur est responsable de la supervision globale de la plateforme. Ses responsabilités incluent :

- Validation ou refus des demandes d'inscription des nouveaux utilisateurs ;
- Création manuelle de comptes utilisateurs ;
- Gestion des sociétés enregistrées ;
- Consultation du journal d'activités ;
- Gestion des certificats numériques ;
- Visualisation du tableau de bord administratif avec KPI globaux.

### 2.1.2 Utilisateur Client (rôle : `CLIENT`)

L'utilisateur client représente un employé ou responsable d'une entreprise utilisant la plateforme. Ses responsabilités incluent :

- Création de factures électroniques (manuelle ou par importation) ;
- Gestion du catalogue de clients et de produits ;
- Signature électronique des factures ;
- Consultation des statistiques de facturation ;
- Consultation des déclarations fiscales mensuelles ;
- Modification du profil de sa société ;
- Changement de société active (architecture multi-entreprises).

## 2.2 Besoins fonctionnels

### BF-01 : Authentification et inscription

- **BF-01.1** : Un visiteur peut s'inscrire en fournissant : nom, e-mail, mot de passe, nom d'entreprise, Matricule Fiscal (13 caractères).
- **BF-01.2** : L'inscription est soumise à validation par l'administrateur (statut `Pending` → `Active` ou `Refused`).
- **BF-01.3** : Lors de la première connexion, un code OTP à 6 chiffres est envoyé par e-mail et doit être vérifié (valide 5 minutes).
- **BF-01.4** : L'utilisateur se connecte avec son e-mail et son mot de passe. Un token JWT est généré (validité : 120 jours).
- **BF-01.5** : L'administrateur est notifié par e-mail lorsqu'un nouveau compte est activé.

### BF-02 : Gestion des utilisateurs (Administrateur)

- **BF-02.1** : L'administrateur peut lister tous les utilisateurs avec leurs sociétés liées.
- **BF-02.2** : L'administrateur peut créer un utilisateur avec tous les champs requis (nom, e-mail, mot de passe, rôle, société, MF).
- **BF-02.3** : L'administrateur peut changer le statut d'un utilisateur (`Active`, `Pending`, `Refused`).
- **BF-02.4** : L'administrateur peut archiver un utilisateur (soft delete avec archivage des sociétés liées).
- **BF-02.5** : Lors de l'activation d'un compte, un e-mail de confirmation est automatiquement envoyé.

### BF-03 : Gestion des sociétés

- **BF-03.1** : L'administrateur peut lister toutes les sociétés.
- **BF-03.2** : L'administrateur peut créer une société (nom, MF 13 caractères, adresse, ville, code postal, téléphone).
- **BF-03.3** : Le MF doit être unique. La vérification est faite côté serveur.
- **BF-03.4** : L'administrateur peut modifier et archiver (soft delete) une société.
- **BF-03.5** : Un mécanisme de synchronisation automatique crée les sociétés à partir des données utilisateurs lors du chargement de la liste.

### BF-04 : Gestion des factures

- **BF-04.1** : L'utilisateur peut créer une facture manuellement avec : numéro auto-incrémenté (`FAC-YYYY-NNNN`), type document (380 = Facture, 381 = Avoir), date, client (sélection ou saisie), période, lignes de facturation.
- **BF-04.2** : Chaque ligne contient : produit (optionnel, depuis le catalogue), description, unité, quantité, prix unitaire HT, taux TVA (0%, 7%, 13%, 19%).
- **BF-04.3** : Les totaux (HT, TVA, TTC) sont recalculés automatiquement côté serveur pour garantir l'intégrité.
- **BF-04.4** : Un droit de timbre forfaitaire de 1,000 DT est appliqué à chaque facture.
- **BF-04.5** : L'utilisateur peut lister ses factures avec filtrage par statut (Validée, En attente, Rejetée) et tri par colonnes.
- **BF-04.6** : L'utilisateur peut visualiser le détail d'une facture et son contenu XML TEIF.
- **BF-04.7** : L'utilisateur peut supprimer une facture (suppression en cascade des lignes).

### BF-05 : Signature électronique

- **BF-05.1** : L'utilisateur peut signer électroniquement une facture en brouillon.
- **BF-05.2** : La signature utilise le profil XAdES-EPES avec certificat X.509 (fichier P12/PFX).
- **BF-05.3** : Après signature, le statut passe à `Validée` et le XML signé est stocké.
- **BF-05.4** : La date de signature est enregistrée.

### BF-06 : Génération XML TEIF

- **BF-06.1** : Le système génère automatiquement le XML TEIF v2.0 pour chaque facture.
- **BF-06.2** : Le XML contient : INVOICEHEADER (MF émetteur et destinataire décomposés en ID_0088 à ID_0091), INVOICEBODY (BGM, DTM, PartnerSection, LINSECTION, TAXSECTION, MOASECTION).
- **BF-06.3** : L'utilisateur peut prévisualiser et télécharger le fichier XML.

### BF-07 : Importation OCR

- **BF-07.1** : L'utilisateur peut importer une facture à partir d'un fichier PDF ou d'une image (JPEG, PNG).
- **BF-07.2** : Le système extrait le texte via OCR (Tesseract.js) ou extraction de texte PDF (pdf.js).
- **BF-07.3** : Un parseur heuristique identifie les champs clés : Matricule Fiscal, numéro de facture, date, montants.

### BF-08 : Statistiques et KPI

- **BF-08.1** : L'utilisateur peut visualiser un résumé avec : Chiffre d'Affaires HT, volume de factures, TVA collectée, droit de timbre cumulé.
- **BF-08.2** : Un graphique d'évolution mensuelle compare l'année en cours à l'année précédente.
- **BF-08.3** : Un graphique en donut affiche la répartition de la TVA par taux.
- **BF-08.4** : Un classement des 5 meilleurs clients par CA est affiché.

### BF-09 : Déclaration fiscale

- **BF-09.1** : L'utilisateur peut sélectionner un mois et consulter le résumé fiscal : CA HT, TVA collectée, droit de timbre, net à payer.
- **BF-09.2** : Le détail est ventilé par taux de TVA.

### BF-10 : Clients et produits

- **BF-10.1** : L'utilisateur peut gérer son catalogue de clients (CRUD) avec validation MF.
- **BF-10.2** : L'utilisateur peut gérer son catalogue de produits (CRUD) avec unités et taux TVA.
- **BF-10.3** : Le MF client est unique globalement dans le système.

## 2.3 Besoins non fonctionnels

| Exigence | Description |
|----------|-------------|
| **Sécurité** | Authentification JWT (HMAC-SHA512), vérification OTP, HTTPS, CORS restreint |
| **Performance** | Temps de réponse API < 500ms, chargement frontend < 2s |
| **Ergonomie** | Interface responsive (Tailwind CSS), navigation intuitive, feedback visuel |
| **Conformité** | XML conforme au XSD TEIF v2.0, signature XAdES-EPES |
| **Maintenabilité** | Architecture en couches, séparation frontend/backend, code commenté |
| **Disponibilité** | Application web accessible 24/7 via navigateur moderne |
| **Compatibilité** | Chrome, Firefox, Safari, Edge (dernières versions) |

## 2.4 Diagramme de cas d'utilisation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        « El Fatoora »                              │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐  │
│  │  S'inscrire           │    │  Valider/Refuser inscription     │  │
│  │  Se connecter (OTP)   │    │  Créer utilisateur               │  │
│  │  Créer facture        │    │  Gérer sociétés                  │  │
│  │  Importer facture OCR │    │  Gérer certificats               │  │
│  │  Signer facture       │    │  Consulter journal d'activités   │  │
│  │  Gérer clients/prod.  │    │  Archiver utilisateur            │  │
│  │  Consulter stats      │    │  Tableau de bord admin           │  │
│  │  Déclaration fiscale  │    └──────────────────────────────────┘  │
│  │  Télécharger XML      │                 ▲                        │
│  │  Modifier profil      │                 │                        │
│  └──────────────────────┘          ┌───────┴───────┐               │
│           ▲                        │ Administrateur │               │
│           │                        └───────────────┘               │
│    ┌──────┴──────┐                                                  │
│    │ Utilisateur  │                                                  │
│    │   Client     │                                                  │
│    └─────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2.5 Description détaillée des cas d'utilisation

### CU-01 : S'authentifier

| Champ | Description |
|-------|-------------|
| **Acteur** | Utilisateur / Administrateur |
| **Préconditions** | L'acteur dispose d'un compte actif |
| **Scénario principal** | 1. L'acteur saisit son e-mail et mot de passe → 2. Le système vérifie les identifiants → 3. Si première connexion : envoi OTP → vérification → 4. Génération du token JWT → 5. Redirection vers le tableau de bord |
| **Scénarios alternatifs** | Identifiants incorrects → message d'erreur ; Compte en attente → message « En attente de validation » ; Compte refusé → message « Demande refusée » |
| **Postconditions** | Token JWT stocké localement, utilisateur authentifié |

### CU-02 : Créer une facture

| Champ | Description |
|-------|-------------|
| **Acteur** | Utilisateur Client |
| **Préconditions** | Authentifié, société sélectionnée |
| **Scénario principal** | 1. Sélection du type de document → 2. Saisie date et période → 3. Sélection du client (catalogue ou saisie libre) → 4. Ajout des lignes (produit, qté, prix, TVA) → 5. Calcul automatique des totaux → 6. Sauvegarde en brouillon → 7. (Optionnel) Visualisation XML TEIF → 8. (Optionnel) Signature électronique |
| **Postconditions** | Facture enregistrée en BDD avec statut « Brouillon », XML TEIF généré |

### CU-03 : Signer une facture

| Champ | Description |
|-------|-------------|
| **Acteur** | Utilisateur Client |
| **Préconditions** | Facture existante, non signée |
| **Scénario principal** | 1. L'utilisateur clique sur « Signer » → 2. Le système charge le certificat P12 → 3. Génération de la signature XAdES-EPES → 4. Ajout de la signature au XML → 5. Mise à jour du statut à « Validée » |
| **Postconditions** | Facture signée, XML signé stocké, date de signature enregistrée |

---

# Chapitre 3 — Conception du Système

## 3.1 Architecture globale de l'application

L'application « El Fatoora » adopte une **architecture client-serveur à trois niveaux** (3-tiers) :

```
┌─────────────────┐     HTTP/REST     ┌─────────────────┐     EF Core     ┌──────────────┐
│    FRONTEND      │ ◄──────────────► │    BACKEND       │ ◄─────────────► │   BASE DE    │
│   React 19 SPA   │    JSON / JWT    │  ASP.NET Core 8  │    Pomelo       │   DONNÉES    │
│   Tailwind CSS   │                  │  Web API (REST)  │   MySQL Driver  │   MySQL 8    │
│   Port 3000      │                  │  Port 5170       │                 │  Port 3307   │
└─────────────────┘                   └─────────────────┘                 └──────────────┘
         │                                     │
         │                                     ├── Services (Email, Signature)
         │                                     ├── Controllers (8 contrôleurs REST)
         │                                     ├── Models (7 entités)
         │                                     ├── DTOs (3 objets de transfert)
         │                                     └── Utils (Générateur TEIF XML)
         │
         ├── Pages (13 composants React)
         ├── Utils (teifGenerator, matriculeValidator)
         └── Assets (images, styles CSS)
```

### Justification des choix technologiques

| Technologie | Version | Justification |
|-------------|---------|---------------|
| **ASP.NET Core** | 8.0 | Framework robuste, performant, multiplateforme, excellent support pour les API REST |
| **Entity Framework Core** | 8.0 | ORM mature, migrations automatiques, requêtes LINQ expressives |
| **MySQL** | 8.x | SGBD open source, fiable, largement utilisé en production |
| **Pomelo.EntityFrameworkCore.MySql** | 8.0.2 | Connecteur EF Core officiel pour MySQL |
| **React** | 19.2 | Librairie UI moderne, composants réutilisables, large écosystème |
| **React Router** | 7.13 | Gestion des routes côté client pour SPA |
| **Tailwind CSS** | 3.4 | Framework CSS utilitaire, responsive, personnalisable |
| **JWT (JSON Web Token)** | — | Standard d'authentification stateless, adapté aux API REST |
| **Tesseract.js** | 7.0 | Moteur OCR JavaScript open source pour l'extraction de texte |
| **pdf.js** | 4.10 | Bibliothèque Mozilla pour l'extraction de texte PDF côté client |
| **System.Security.Cryptography.Xml** | 10.0.5 | Bibliothèque .NET pour la signature XML (XMLDSig / XAdES) |

## 3.2 Architecture backend (API REST)

Le backend suit le pattern **MVC sans vues** (API-only), organisé en couches :

```
backend/
├── Program.cs                    ← Point d'entrée, configuration DI, middleware
├── appsettings.json              ← Configuration (BDD, JWT, Certificat)
├── Controllers/                  ← Couche Présentation (8 contrôleurs)
│   ├── AuthController.cs         ← Authentification (login, register, OTP)
│   ├── UsersController.cs        ← CRUD utilisateurs
│   ├── CompaniesController.cs    ← CRUD sociétés
│   ├── InvoicesController.cs     ← CRUD factures + signature
│   ├── ClientsController.cs      ← CRUD clients
│   ├── ProductsController.cs     ← CRUD produits
│   ├── StatisticsController.cs   ← Endpoints statistiques
│   └── ActivitiesController.cs   ← Journal d'activités
├── Models/                       ← Couche Domaine (7 entités)
│   ├── User.cs
│   ├── Company.cs
│   ├── Invoice.cs
│   ├── InvoiceLine.cs
│   ├── Client.cs
│   ├── Product.cs
│   └── ActivityLog.cs
├── Data/                         ← Couche Persistance
│   └── ApplicationDbContext.cs   ← DbContext EF Core (configuration Fluent API)
├── DTOs/                         ← Objets de Transfert de Données
│   ├── AuthDto.cs                ← LoginDto, AuthResponseDto, CompanySummaryDto
│   └── VerifyOtpDto.cs           ← DTO vérification OTP
├── Services/                     ← Couche Services métier
│   ├── IEmailService.cs          ← Interface service e-mail
│   ├── EmailService.cs           ← Implémentation SMTP (Gmail)
│   ├── ISignatureService.cs      ← Interface service signature
│   └── SignatureService.cs       ← Implémentation XAdES-EPES
├── Utils/                        ← Utilitaires
│   └── TeifGenerator.cs          ← Générateur XML TEIF v2.0
├── Migrations/                   ← Migrations EF Core (10 migrations)
└── Certificates/                 ← Certificats numériques P12/PFX
```

### Tableau des endpoints API REST

| Méthode | Route | Description | Contrôleur |
|---------|-------|-------------|------------|
| POST | `/api/Auth/login` | Connexion utilisateur | AuthController |
| POST | `/api/Auth/register` | Inscription | AuthController |
| POST | `/api/Auth/verify-otp` | Vérification OTP | AuthController |
| GET | `/api/Auth/seed-admin` | Initialisation admin | AuthController |
| GET | `/api/Users` | Liste utilisateurs | UsersController |
| POST | `/api/Users` | Créer utilisateur | UsersController |
| DELETE | `/api/Users/{id}` | Archiver utilisateur | UsersController |
| PUT | `/api/Users/{id}/status` | Modifier statut | UsersController |
| GET | `/api/Companies` | Liste sociétés | CompaniesController |
| GET | `/api/Companies/{id}` | Détail société | CompaniesController |
| POST | `/api/Companies` | Créer société | CompaniesController |
| PUT | `/api/Companies/{id}` | Modifier société | CompaniesController |
| DELETE | `/api/Companies/{id}` | Archiver société | CompaniesController |
| GET | `/api/Invoices` | Liste factures | InvoicesController |
| GET | `/api/Invoices/{id}` | Détail facture | InvoicesController |
| GET | `/api/Invoices/next-number` | Prochain numéro | InvoicesController |
| POST | `/api/Invoices` | Créer facture | InvoicesController |
| PUT | `/api/Invoices/{id}/status` | Modifier statut facture | InvoicesController |
| POST | `/api/Invoices/{id}/sign` | Signer facture | InvoicesController |
| DELETE | `/api/Invoices/{id}` | Supprimer facture | InvoicesController |
| GET | `/api/Clients` | Liste clients | ClientsController |
| GET | `/api/Clients/{id}` | Détail client | ClientsController |
| POST | `/api/Clients` | Créer client | ClientsController |
| PUT | `/api/Clients/{id}` | Modifier client | ClientsController |
| DELETE | `/api/Clients/{id}` | Supprimer client | ClientsController |
| GET | `/api/Products` | Liste produits | ProductsController |
| GET | `/api/Products/{id}` | Détail produit | ProductsController |
| POST | `/api/Products` | Créer produit | ProductsController |
| PUT | `/api/Products/{id}` | Modifier produit | ProductsController |
| DELETE | `/api/Products/{id}` | Supprimer produit | ProductsController |
| GET | `/api/Statistics/summary` | Résumé KPI | StatisticsController |
| GET | `/api/Statistics/monthly-evolution` | Évolution mensuelle | StatisticsController |
| GET | `/api/Statistics/tva-distribution` | Répartition TVA | StatisticsController |
| GET | `/api/Statistics/top-clients` | Top 5 clients | StatisticsController |
| GET | `/api/Statistics/tax-summary` | Résumé fiscal mensuel | StatisticsController |
| GET | `/api/Activities/recent` | 10 dernières activités | ActivitiesController |
| GET | `/api/Activities` | Toutes les activités | ActivitiesController |
| POST | `/api/Activities` | Enregistrer activité | ActivitiesController |

## 3.3 Architecture frontend (SPA React)

Le frontend est une **Single Page Application** React avec routage côté client :

```
frontend/src/
├── App.js                        ← Routeur principal (Login, Dashboard, AdminDashboard)
├── index.js                      ← Point d'entrée React
├── pages/
│   ├── Login.js                  ← Page d'authentification + inscription + OTP
│   ├── Dashboard.js              ← Tableau de bord utilisateur (accueil + navigation)
│   ├── AdminDashboard.js         ← Tableau de bord administrateur complet
│   ├── InvoiceManagement.js      ← Container onglets (Liste, Import, Création)
│   ├── CreateInvoice.js          ← Formulaire création facture TEIF
│   ├── ImportInvoice.js          ← Importation OCR (PDF/Image)
│   ├── InvoiceLists.js           ← Liste factures avec filtrage/tri/signature
│   ├── MyInvoices.js             ← Liste factures (version démo/statique)
│   ├── Statistics.js             ← Tableaux de bord statistiques (graphiques SVG)
│   ├── TaxDeclaration.js         ← Déclaration fiscale mensuelle
│   ├── ClientsProducts.js        ← Gestion clients et produits (CRUD)
│   ├── CompanyProfile.js         ← Profil et paramètres société
│   └── ErrorDiagnostic.js        ← Diagnostic erreurs factures rejetées
├── utils/
│   ├── teifGenerator.js          ← Génération XML TEIF côté client
│   └── matriculeValidator.js     ← Validation Matricule Fiscal
└── assets/
    ├── abstract3d.png            ← Images carrousel login
    ├── slide2.png
    └── slide3.png
```

### Gestion de l'état et du routage

L'application utilise une gestion d'état simple basée sur :

- **`useState`** et **`useEffect`** de React pour l'état local des composants ;
- **`localStorage`** pour la persistance de la session (token JWT, données utilisateur) ;
- **React Router v7** pour le routage avec protection des routes par rôle :
  - Route `/login` → composant `Login` ;
  - Route `/dashboard` → `AdminDashboard` (si rôle `admin`) ou `Dashboard` (si rôle `CLIENT`) ;
  - Redirection automatique selon l'état d'authentification.

## 3.4 Conception de la base de données

### 3.4.1 Schéma relationnel

La base de données **`elfatoora_db`** (MySQL) comprend **7 tables** principales et une table de jointure :

```
┌──────────────┐       Many-to-Many        ┌──────────────┐
│    Users      │ ◄──────────────────────► │  Companies    │
│──────────────│   (CompanyUser - table    │──────────────│
│ PK: Id        │    de jointure implicite  │ PK: Id        │
│ Email (UQ)    │    gérée par EF Core)     │ RegNumber(UQ) │
│ Password      │                           │ Name          │
│ Role          │                           │ Address       │
│ Status        │                           │ City          │
│ IsFirstLogin  │                           │ PostalCode    │
│ OtpCode       │                           │ Phone         │
│ OtpExpiryTime │                           │ IsArchived    │
│ LastActivity  │                           └──────┬───────┘
└──────────────┘                                   │
                                                   │ 1:N
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                              ▼                    ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                    │   Clients     │    │   Products    │    │   Invoices    │
                    │──────────────│    │──────────────│    │──────────────│
                    │ PK: Id        │    │ PK: Id        │    │ PK: Id        │
                    │ FK: CompanyId  │    │ FK: CompanyId  │    │ FK: CompanyId  │
                    │ Name          │    │ Name          │    │ FK: ClientId   │
                    │ MF (UQ)       │    │ Description   │    │ InvoiceNumber  │
                    │ Address       │    │ Unit          │    │ DocumentType   │
                    │ City          │    │ TvaRate       │    │ Date           │
                    │ Phone         │    │ DefaultPrice  │    │ TotalHT/TVA/TTC│
                    └──────────────┘    └──────────────┘    │ Status         │
                                                            │ IsSigned       │
                                                            │ SignedXmlContent│
                                                            └──────┬───────┘
                                                                   │ 1:N
                                                                   ▼
                                                         ┌──────────────┐
                                                         │ InvoiceLines  │
                                                         │──────────────│
                                                         │ PK: Id        │
                                                         │ FK: InvoiceId  │
                                                         │ FK: ProductId  │
                                                         │ Description   │
                                                         │ Unit / Qty    │
                                                         │ UnitPriceHT   │
                                                         │ TotalHT/TVA   │
                                                         └──────────────┘

                    ┌──────────────┐
                    │ ActivityLogs  │  (table indépendante)
                    │──────────────│
                    │ PK: Id        │
                    │ Actor         │
                    │ Action        │
                    │ TargetInfo    │
                    │ Type          │
                    │ Timestamp     │
                    └──────────────┘
```

### 3.4.2 Description détaillée des tables

#### Table `Users`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| Username | varchar | NOT NULL | Nom d'utilisateur |
| Email | varchar | NOT NULL, UNIQUE | Adresse e-mail (login) |
| Password | varchar | NOT NULL | Mot de passe (stocké en clair — *à sécuriser*) |
| Role | varchar | DEFAULT 'user' | Rôle : `admin` ou `CLIENT` |
| Name | varchar | NOT NULL | Nom complet |
| Entreprise | varchar | | Nom de l'entreprise |
| MatriculeFiscal | varchar | | Matricule Fiscal (13 car.) |
| Status | varchar | DEFAULT 'Pending' | Statut : `Pending`, `Active`, `Refused`, `Archived` |
| Actif | bit | DEFAULT 1 | Indicateur d'activité |
| IsFirstLogin | bit | DEFAULT 1 | Indicateur première connexion (déclenche OTP) |
| OtpCode | varchar | NULLABLE | Code OTP temporaire (6 chiffres) |
| OtpExpiryTime | datetime | NULLABLE | Date d'expiration OTP |
| LastActivity | datetime | NULLABLE | Dernière activité de l'utilisateur |

#### Table `Companies`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| Name | varchar | NOT NULL | Raison sociale |
| RegistrationNumber | varchar | NOT NULL, UNIQUE | Matricule Fiscal (13 car.) |
| Address | varchar | | Adresse complète |
| City | varchar | | Ville |
| PostalCode | varchar | | Code postal |
| Phone | varchar | | Numéro de téléphone |
| IsArchived | bit | DEFAULT 0 | Indicateur de suppression logique |

#### Table `Invoices`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| InvoiceNumber | varchar | NOT NULL | Numéro auto-généré (`FAC-YYYY-NNNN`) |
| DocumentType | varchar | DEFAULT '380' | 380 = Facture, 381 = Note d'avoir |
| Date | datetime | DEFAULT UTC NOW | Date d'émission |
| ClientId | int | FK → Clients.Id, NULLABLE | Référence client (SET NULL si supprimé) |
| ClientName | varchar | | Snapshot du nom client |
| ClientMatricule | varchar | | Snapshot du MF client |
| ClientAddress | varchar | | Snapshot de l'adresse client |
| PeriodFrom | datetime | NULLABLE | Début de période |
| PeriodTo | datetime | NULLABLE | Fin de période |
| TotalHT | decimal(18,3) | | Total Hors Taxes |
| TotalTVA | decimal(18,3) | | Total TVA |
| StampDuty | decimal(18,3) | DEFAULT 0 | Droit de timbre (1,000 DT) |
| TotalTTC | decimal(18,3) | | Total Toutes Taxes Comprises |
| Status | varchar | DEFAULT 'Brouillon' | Brouillon, Validée, Rejetée |
| FilePath | varchar | | Chemin du fichier XML |
| XmlContent | text | | Contenu XML TEIF brut |
| IsSigned | bit | DEFAULT 0 | Indicateur de signature |
| SignedAt | datetime | NULLABLE | Date de signature |
| SignedXmlContent | text | | XML signé (XAdES) |
| CompanyId | int | FK → Companies.Id, CASCADE | Société émettrice |

#### Table `InvoiceLines`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| InvoiceId | int | FK → Invoices.Id, CASCADE | Facture parente |
| ProductId | int | FK → Products.Id, SET NULL, NULLABLE | Produit référencé |
| Description | varchar | | Libellé de la ligne |
| Unit | varchar | DEFAULT 'Pièce' | Unité de mesure |
| Qty | int | DEFAULT 1 | Quantité |
| TvaRate | int | DEFAULT 19 | Taux TVA (0, 7, 13, 19) |
| UnitPriceHT | decimal(18,3) | | Prix unitaire HT |
| TotalHT | decimal(18,3) | | Total HT de la ligne |
| TotalTVA | decimal(18,3) | | Total TVA de la ligne |

#### Table `Clients`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| Name | varchar | NOT NULL | Raison sociale du client |
| MatriculeFiscal | varchar | UNIQUE | MF du client (13 car.) |
| Address | varchar | | Adresse |
| City | varchar | | Ville |
| Phone | varchar | | Téléphone |
| CompanyId | int | FK → Companies.Id, CASCADE | Société propriétaire |

#### Table `Products`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| Name | varchar | NOT NULL | Nom du produit/service |
| Description | varchar | | Description détaillée |
| Unit | varchar | DEFAULT 'Pièce' | Unité (Pièce, Heure, Jour, KG) |
| TvaRate | int | DEFAULT 19 | Taux TVA applicable |
| DefaultPrice | decimal(18,3) | DEFAULT 0 | Prix unitaire par défaut |
| CompanyId | int | FK → Companies.Id, CASCADE | Société propriétaire |

#### Table `ActivityLogs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| Id | int | PK, Auto-increment | Identifiant unique |
| Actor | varchar | NOT NULL | Nom de l'acteur |
| Action | varchar | NOT NULL | Description de l'action |
| TargetInfo | varchar | NOT NULL | Entité ciblée |
| Type | varchar | NOT NULL | Type d'action (user_creation, invoice_creation, etc.) |
| Timestamp | datetime | DEFAULT UTC NOW | Horodatage |

### 3.4.3 Relations et contraintes d'intégrité

| Relation | Type | Comportement suppression |
|----------|------|-------------------------|
| User ↔ Company | Many-to-Many | Table de jointure implicite (EF Core) |
| Company → Clients | One-to-Many | CASCADE (suppression en cascade) |
| Company → Products | One-to-Many | CASCADE |
| Company → Invoices | One-to-Many | CASCADE |
| Invoice → InvoiceLines | One-to-Many | CASCADE |
| Invoice → Client | Many-to-One (optionnel) | SET NULL |
| InvoiceLine → Product | Many-to-One (optionnel) | SET NULL |

### 3.4.4 Historique des migrations

L'évolution du schéma a été gérée via **10 migrations EF Core** :

| # | Date | Migration | Description |
|---|------|-----------|-------------|
| 1 | 31/03/2026 | InitialFullCreate | Création initiale (Users, Companies, Invoices) |
| 2 | 31/03/2026 | FinalFixProfileFields | Ajout champs profil utilisateur |
| 3 | 31/03/2026 | AddLastActivityToUser | Champ LastActivity |
| 4 | 31/03/2026 | AddMoreCompanyDetails | Champs City, PostalCode, Phone pour Company |
| 5 | 03/04/2026 | AddProductsInvoiceLinesClients | Ajout tables Products, InvoiceLines, Clients |
| 6 | 03/04/2026 | UniqueMatriculeFiscalClient | Contrainte UNIQUE sur Client.MF |
| 7 | 04/04/2026 | SupportMultipleCompaniesV2 | Relation Many-to-Many User ↔ Company |
| 8 | 08/04/2026 | AddUserOTPFields | Champs OTP (OtpCode, OtpExpiryTime) |
| 9 | 08/04/2026 | CascadeDeleteCompany | Suppression en cascade Company |
| 10 | 08/04/2026 | AddIsArchivedToCompany | Soft delete (IsArchived) |
| 11 | 08/04/2026 | AddActivityLogs | Table ActivityLogs |
| 12 | 09/04/2026 | AddSignatureFields | Champs IsSigned, SignedAt, SignedXmlContent |

## 3.5 Diagramme de classes UML

```
┌───────────────────────────────────────┐
│              User                      │
├───────────────────────────────────────┤
│ - Id: int                              │
│ - Username: string                     │
│ - Email: string {unique}               │
│ - Password: string                     │
│ - Role: string                         │
│ - Name: string                         │
│ - Entreprise: string                   │
│ - MatriculeFiscal: string              │
│ - Status: string                       │
│ - Actif: bool                          │
│ - IsFirstLogin: bool                   │
│ - OtpCode: string?                     │
│ - OtpExpiryTime: DateTime?             │
│ - LastActivity: DateTime?              │
├───────────────────────────────────────┤
│ + Companies: ICollection<Company>      │
└───────────────┬───────────────────────┘
                │ *..* 
                │
┌───────────────┴───────────────────────┐
│             Company                    │
├───────────────────────────────────────┤
│ - Id: int                              │
│ - Name: string                         │
│ - RegistrationNumber: string {unique}  │
│ - Address: string                      │
│ - City: string                         │
│ - PostalCode: string                   │
│ - Phone: string                        │
│ - IsArchived: bool                     │
├───────────────────────────────────────┤
│ + Users: ICollection<User>             │
│ + Invoices: ICollection<Invoice>       │
│ + Clients: ICollection<Client>         │
│ + Products: ICollection<Product>       │
└──┬──────────────┬─────────────┬───────┘
   │ 1..*         │ 1..*        │ 1..*
   ▼              ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────────────────────┐
│  Client   │ │ Product  │ │        Invoice            │
├──────────┤ ├──────────┤ ├──────────────────────────┤
│ Id        │ │ Id        │ │ Id                        │
│ Name      │ │ Name      │ │ InvoiceNumber             │
│ MF {UQ}   │ │ Desc      │ │ DocumentType              │
│ Address   │ │ Unit      │ │ Date                      │
│ City      │ │ TvaRate   │ │ ClientId?: FK → Client    │
│ Phone     │ │ DefPrice  │ │ ClientName (snapshot)     │
│ CompanyId │ │ CompanyId │ │ TotalHT/TVA/StampDuty/TTC │
└──────────┘ └──────────┘ │ Status                    │
                           │ IsSigned / SignedAt        │
                           │ XmlContent/SignedXmlContent │
                           │ CompanyId: FK → Company    │
                           ├──────────────────────────┤
                           │ + Lines: ICollection       │
                           └─────────────┬────────────┘
                                         │ 1..*
                                         ▼
                             ┌──────────────────────┐
                             │    InvoiceLine        │
                             ├──────────────────────┤
                             │ Id                    │
                             │ InvoiceId: FK         │
                             │ ProductId?: FK        │
                             │ Description           │
                             │ Unit / Qty            │
                             │ TvaRate               │
                             │ UnitPriceHT           │
                             │ TotalHT / TotalTVA    │
                             └──────────────────────┘

┌───────────────────────────────┐
│        ActivityLog             │
├───────────────────────────────┤
│ Id                             │
│ Actor: string                  │
│ Action: string                 │
│ TargetInfo: string             │
│ Type: string                   │
│ Timestamp: DateTime            │
└───────────────────────────────┘
```

## 3.6 Diagrammes de séquence

### 3.6.1 Séquence : Authentification avec OTP

```
Utilisateur          Frontend (React)         Backend (API)            EmailService          BDD (MySQL)
    │                      │                       │                       │                    │
    │── Saisie email/mdp ─►│                       │                       │                    │
    │                      │── POST /api/Auth/login─►                      │                    │
    │                      │                       │── SELECT User WHERE ──►│                    │
    │                      │                       │   email = ?            │◄── User trouvé ────│
    │                      │                       │                       │                    │
    │                      │                       │── [IsFirstLogin=true] │                    │
    │                      │                       │── Générer OTP 6 digits│                    │
    │                      │                       │── UPDATE User (OTP)───►│                    │
    │                      │                       │── SendEmailAsync ─────►│                    │
    │                      │                       │                       │── SMTP Gmail ──────►│
    │                      │◄─ {requireOtp: true} ─│                       │                    │
    │◄─ Afficher form OTP ─│                       │                       │                    │
    │                      │                       │                       │                    │
    │── Saisie code OTP ──►│                       │                       │                    │
    │                      │── POST /verify-otp ──►│                       │                    │
    │                      │                       │── Vérifier OTP + exp ─►│                    │
    │                      │                       │── UPDATE IsFirstLogin=0                    │
    │                      │                       │── Créer JWT Token      │                    │
    │                      │◄── {token, user} ─────│                       │                    │
    │                      │── localStorage.set ───│                       │                    │
    │◄─ Redirect Dashboard ─│                       │                       │                    │
```

### 3.6.2 Séquence : Création et signature d'une facture

```
Utilisateur          Frontend (React)           Backend (API)          SignatureService       BDD
    │                      │                         │                       │                 │
    │── Remplir formulaire ─►                        │                       │                 │
    │── Clic "Sauvegarder" ─►                        │                       │                 │
    │                      │── POST /api/Invoices ──►│                       │                 │
    │                      │                         │── Valider données      │                 │
    │                      │                         │── Recalculer totaux    │                 │
    │                      │                         │── Générer numéro FAC   │                 │
    │                      │                         │── INSERT Invoice ──────►                 │
    │                      │                         │── INSERT Lines ────────►                 │
    │                      │                         │── INSERT ActivityLog ──►                 │
    │                      │◄── Invoice créée ───────│                       │                 │
    │◄─ Afficher succès ───│                         │                       │                 │
    │                      │                         │                       │                 │
    │── Clic "Signer" ────►│                         │                       │                 │
    │                      │── POST /Invoices/5/sign─►                       │                 │
    │                      │                         │── Charger Invoice+Co   │                 │
    │                      │                         │── Générer XML TEIF     │                 │
    │                      │                         │── SignTeifXml(xml) ───►│                 │
    │                      │                         │                       │── Load P12 cert  │
    │                      │                         │                       │── XAdES-EPES sign│
    │                      │                         │◄── signedXml ─────────│                 │
    │                      │                         │── UPDATE IsSigned=true─►                 │
    │                      │                         │── Status="Validée" ───►                 │
    │                      │◄── Facture signée ──────│                       │                 │
    │◄─ Afficher "Signée" ─│                         │                       │                 │
```

---

# Chapitre 4 — Réalisation et Implémentation

## 4.1 Environnement technique et outils utilisés

### 4.1.1 Environnement de développement

| Outil | Version | Rôle |
|-------|---------|------|
| **Visual Studio Code** | Latest | IDE principal (édition, débogage, extensions) |
| **.NET SDK** | 8.0 | Compilation et exécution du backend |
| **Node.js** | 18+ | Environnement d'exécution JavaScript pour le frontend |
| **npm** | 9+ | Gestionnaire de paquets frontend |
| **MySQL Server** | 8.x | Serveur de base de données (port 3307) |
| **Git** | Latest | Gestion de versions |

### 4.1.2 Dépendances backend (NuGet)

| Package | Version | Utilisation |
|---------|---------|-------------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.2 | Middleware JWT |
| `Microsoft.EntityFrameworkCore.Design` | 8.0.2 | Migrations EF Core |
| `Microsoft.EntityFrameworkCore.Tools` | 8.0.2 | Outils CLI EF Core |
| `Pomelo.EntityFrameworkCore.MySql` | 8.0.2 | Provider MySQL pour EF Core |
| `Swashbuckle.AspNetCore` | 6.6.2 | Documentation Swagger/OpenAPI |
| `System.Security.Cryptography.Xml` | 10.0.5 | Signature XML (XAdES) |

### 4.1.3 Dépendances frontend (npm)

| Package | Version | Utilisation |
|---------|---------|-------------|
| `react` | 19.2.4 | Bibliothèque UI principale |
| `react-dom` | 19.2.4 | Rendu DOM |
| `react-router-dom` | 7.13.1 | Routage SPA |
| `tesseract.js` | 7.0.0 | Moteur OCR côté client |
| `pdfjs-dist` | 4.10.38 | Extraction texte PDF |
| `tailwindcss` | 3.4.17 | Framework CSS utilitaire |
| `postcss` | 8.4.49 | Transformation CSS |
| `autoprefixer` | 10.4.20 | Préfixes CSS automatiques |

### 4.1.4 Exécution de l'application

L'application utilise **`concurrently`** pour lancer simultanément les deux serveurs :

```bash
npm run dev    # Lance backend (.NET) + frontend (React) en parallèle
```

- **Backend** : `dotnet run` → port **5170** (HTTP) ;
- **Frontend** : `react-scripts start` → port **3000** ;
- **CORS** : Le backend autorise les requêtes depuis `http://localhost:3000`.

## 4.2 Module d'Authentification et Sécurité

### 4.2.1 Architecture du module

Le module d'authentification est implémenté dans `AuthController.cs` et repose sur :

- **JWT (JSON Web Token)** avec algorithme **HMAC-SHA512** pour la signature des tokens ;
- **Vérification OTP par e-mail** pour la première connexion (via `EmailService`) ;
- **Gestion des statuts utilisateur** : `Pending` → `Active` / `Refused`.

### 4.2.2 Processus d'inscription (`POST /api/Auth/register`)

Le processus d'inscription suit les étapes suivantes :

1. **Validation de l'e-mail** : Vérification de l'unicité dans la base de données ;
2. **Validation du Matricule Fiscal** : Exactement 13 caractères conformes au format tunisien ;
3. **Attribution du rôle** : Automatiquement défini à `CLIENT` ;
4. **Création de société** : Si l'entreprise et le MF sont fournis, une société est automatiquement créée ou liée si elle existe déjà (recherche par `RegistrationNumber`) ;
5. **Statut initial** : `Pending` — l'utilisateur ne peut pas se connecter avant validation par l'administrateur.

### 4.2.3 Processus de connexion (`POST /api/Auth/login`)

Le flux de connexion implémente plusieurs contrôles :

1. **Vérification des identifiants** : Comparaison e-mail/mot de passe ;
2. **Contrôle du statut** : Seuls les utilisateurs `Active` (ou admins) peuvent se connecter ;
3. **Première connexion (OTP)** :
   - Génération d'un code à 6 chiffres aléatoires ;
   - Stockage du code et de son expiration (5 minutes) en base ;
   - Envoi par e-mail via `EmailService` (SMTP Gmail) ;
   - Retour d'un flag `requireOtp: true` au frontend ;
4. **Connexions suivantes** : Génération directe du token JWT.

### 4.2.4 Génération du token JWT

Le token JWT contient les claims suivants :

| Claim | Valeur |
|-------|--------|
| `ClaimTypes.Name` | Nom de l'utilisateur |
| `ClaimTypes.Email` | E-mail |
| `ClaimTypes.Role` | Rôle (`admin` ou `CLIENT`) |
| `userId` | Identifiant numérique |

Le token est signé avec une clé secrète de 112 caractères, a une validité de 120 jours, et utilise l'émetteur `elfatoora-api` et l'audience `elfatoora-app`.

### 4.2.5 Service d'envoi d'e-mails (`EmailService`)

Le service e-mail utilise le protocole **SMTP** via Gmail :

- **Serveur** : `smtp.gmail.com`, port 587 (TLS) ;
- **Authentification** : Mot de passe d'application Google ;
- **Utilisations** : Envoi OTP, notification d'activation de compte.

## 4.3 Module de Gestion des Utilisateurs et des Sociétés

### 4.3.1 Gestion des utilisateurs (`UsersController`)

Ce contrôleur fournit les opérations CRUD suivantes :

- **GET `/api/Users`** : Liste tous les utilisateurs avec leurs sociétés liées (`Include(u => u.Companies)`) ;
- **POST `/api/Users`** : Création d'un utilisateur par l'administrateur avec :
  - Validation de l'unicité de l'e-mail ;
  - Validation du MF (13 caractères, catégorie valide : A, P, B, M) ;
  - Création automatique de la société si elle n'existe pas ;
  - Journalisation de l'action dans `ActivityLogs` ;
- **DELETE `/api/Users/{id}`** : **Archivage logique** (soft delete) — le statut passe à `Archived` et les sociétés liées sont marquées `IsArchived = true` ;
- **PUT `/api/Users/{id}/status`** : Modification du statut avec envoi automatique d'e-mail de notification si le statut passe à `Active`.

### 4.3.2 Gestion des sociétés (`CompaniesController`)

Ce contrôleur implémente :

- **GET `/api/Companies`** : Liste avec **synchronisation automatique** — un mécanisme interne (`SyncCompaniesInternal`) crée les sociétés manquantes à partir des données utilisateurs et lie les utilisateurs existants ;
- **POST `/api/Companies`** : Création avec validation du MF (13 caractères, unicité) et liaison optionnelle à un utilisateur via `?userId=` ;
- **PUT `/api/Companies/{id}`** : Modification des informations (nom, adresse, ville, code postal, téléphone) ;
- **DELETE `/api/Companies/{id}`** : Archivage logique (`IsArchived = true`).

### 4.3.3 Architecture multi-entreprises

L'application supporte un modèle multi-entreprises grâce à :

- **Relation Many-to-Many** entre `User` et `Company` (table de jointure gérée par EF Core) ;
- **Sélecteur de société** dans le frontend : l'utilisateur peut basculer entre ses sociétés via un menu dropdown ;
- **Filtrage contextuel** : toutes les données (factures, clients, produits) sont filtrées par `companyId`.

## 4.4 Module de Gestion des Factures Électroniques

### 4.4.1 Modèle de données

La facture (`Invoice`) utilise un **pattern de snapshot** pour les données client : les champs `ClientName`, `ClientMatricule` et `ClientAddress` sont dupliqués depuis le client au moment de la création, afin de préserver l'historique même si le client est modifié ou supprimé ultérieurement.

Les montants utilisent le type `decimal(18,3)` pour respecter la convention tunisienne des **3 décimales** (millimes).

### 4.4.2 Création de facture (`POST /api/Invoices`)

Le processus de création côté serveur inclut :

1. **Validation** : société émettrice obligatoire, nom client obligatoire, au moins une ligne ;
2. **Numérotation automatique** : format `FAC-YYYY-NNNN` basé sur le compteur de factures de la société pour l'année en cours ;
3. **Recalcul des totaux côté serveur** : pour chaque ligne, `TotalHT = Qty × UnitPriceHT` et `TotalTVA = TotalHT × (TvaRate / 100)`, puis agrégation pour la facture ;
4. **Statut initial** : `Brouillon` ;
5. **Journalisation** : enregistrement dans `ActivityLogs`.

### 4.4.3 Interface de création (frontend)

Le composant `CreateInvoice.js` (721 lignes) offre une interface riche :

- **En-tête** : numéro auto-incrémenté, type de document (Facture/Avoir), date, période ;
- **Section client** : sélection depuis le catalogue ou saisie libre avec validation MF temps réel ;
- **Section lignes** : ajout dynamique de lignes depuis le catalogue produits ou en saisie libre, avec calcul automatique des totaux ;
- **Aperçu XML** : génération et affichage du XML TEIF directement dans l'interface ;
- **Actions** : sauvegarde en brouillon, prévisualisation, téléchargement XML.

### 4.4.4 Liste et filtrage des factures

Le composant `InvoiceLists.js` (477 lignes) offre :

- **Trois onglets de filtrage** : Validées, En attente, Rejetées ;
- **Tri par colonnes** : date (défaut), numéro, client, montant, statut ;
- **Recherche textuelle** : sur le numéro de facture et le nom du client ;
- **Actions par facture** : visualisation détaillée, téléchargement XML, signature électronique ;
- **Diagnostic d'erreur** : lien vers le module `ErrorDiagnostic` pour les factures rejetées.

## 4.5 Module de Signature Électronique XAdES-EPES

### 4.5.1 Architecture du service de signature

Le service de signature (`SignatureService.cs`, 231 lignes) implémente le profil **XAdES-EPES** (XML Advanced Electronic Signatures — Explicit Policy-based Electronic Signatures) conformément aux exigences de Tunisie TradeNet.

### 4.5.2 Classe `XadesSignedXml`

Une classe personnalisée `XadesSignedXml` hérite de `SignedXml` (.NET) et surcharge la méthode `GetIdElement` pour supporter la résolution d'identifiants dans les `DataObjects` XAdES :

- **Recherche standard** : via `base.GetIdElement()` ;
- **Recherche dans les DataObjects** : parcours récursif des nœuds XML ajoutés comme objets de données ;
- **Recherche globale** : scan complet du document XML par attribut `Id`.

Cette surcharge est nécessaire car le standard XAdES requiert des références internes (`#SignedProperties-ElFetoora`) qui ne sont pas résolues par l'implémentation standard .NET.

### 4.5.3 Processus de signature

Le processus de signature XAdES-EPES comprend 7 étapes :

1. **Chargement du certificat** : fichier P12/PFX avec mot de passe (configuration via `appsettings.json`) ;
2. **Création de la référence document** : référence URI vide avec transformations `EnvelopedSignature` + `C14N` ;
3. **Ajout de KeyInfo** : informations X.509 du certificat (clé publique, chaîne de certification) ;
4. **Création des QualifyingProperties XAdES** :
   - `SigningTime` : horodatage UTC ;
   - `SigningCertificate` : hash SHA-256 du certificat, émetteur et numéro de série ;
   - `SignaturePolicyIdentifier` : référence à la politique de signature TEIF ;
5. **Ajout de l'objet XAdES** à la signature comme `DataObject` ;
6. **Création de la référence aux SignedProperties** : lien vers `#SignedProperties-ElFetoora` ;
7. **Calcul et insertion de la signature** : remplacement du placeholder `<ds:Signature>` dans le XML TEIF.

### 4.5.4 Endpoint de signature (`POST /api/Invoices/{id}/sign`)

Le contrôleur `InvoicesController` orchestre le processus :

1. Chargement de la facture avec ses lignes et sa société ;
2. Vérification qu'elle n'est pas déjà signée ;
3. Génération du XML TEIF si absent (via `TeifGenerator.GenerateXml()`) ;
4. Appel au `SignatureService.SignTeifXml()` ;
5. Mise à jour : `IsSigned = true`, `SignedAt = UTC`, `Status = "Validée"` ;
6. Journalisation dans `ActivityLogs`.

## 4.6 Module de Génération XML TEIF v2.0

### 4.6.1 Structure du XML TEIF

Le générateur XML TEIF (`TeifGenerator.cs`, backend ; `teifGenerator.js`, frontend) produit un document conforme au schéma officiel :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TEIF xmlns="urn:tn:gov:dgi:teif:2.0" version="2.0" controlingAgency="TTN">
  <INVOICEHEADER>
    <MessageSenderIdentifier>1234567APM000</MessageSenderIdentifier>
    <MessageRecieverIdentifier>7654321BPM000</MessageRecieverIdentifier>
  </INVOICEHEADER>
  <INVOICEBODY>
    <BGM>
      <Element1001>380</Element1001>     <!-- 380=Facture, 381=Avoir -->
    </BGM>
    <DTM>20260415</DTM>                  <!-- Date YYYYMMDD -->
    <PartnerSection>
      <NAD>                              <!-- Émetteur (SE) -->
        <PartyType>SE</PartyType>
        <ID_0088>1234567A</ID_0088>      <!-- 8 premiers caractères MF -->
        <ID_0089>P</ID_0089>             <!-- Code TVA -->
        <ID_0090>M</ID_0090>             <!-- Catégorie -->
        <ID_0091>000</ID_0091>           <!-- Établissement -->
        <Name>Ma Société</Name>
        <Address>Tunis</Address>
      </NAD>
      <NAD>                              <!-- Destinataire (BY) -->
        ...
      </NAD>
    </PartnerSection>
    <LINSECTION>                         <!-- Lignes de facturation -->
      <LIN>
        <Element1082>1</Element1082>     <!-- Numéro de ligne -->
        <Element7008>Description</Element7008>
        <Element6060>2.000</Element6060> <!-- Quantité -->
        <Element5118>100.000</Element5118><!-- Prix unitaire HT -->
        <MOA>200.000</MOA>               <!-- Total HT ligne -->
      </LIN>
    </LINSECTION>
    <TAXSECTION>                         <!-- Ventilation fiscale -->
      <TaxGroup>
        <TaxCategoryCode>I-1602</TaxCategoryCode>
        <TaxRate>19.000</TaxRate>
        <TaxBaseAmount>200.000</TaxBaseAmount>
        <TaxAmount>38.000</TaxAmount>
      </TaxGroup>
      <TaxGroup>
        <TaxCategoryCode>I-1601</TaxCategoryCode>  <!-- Droit de timbre -->
        <TaxAmount>1.000</TaxAmount>
      </TaxGroup>
    </TAXSECTION>
    <MOASECTION>                         <!-- Totaux globaux -->
      <MOA><Element5025>79</Element5025><Element5004>200.000</Element5004></MOA>  <!-- HT -->
      <MOA><Element5025>176</Element5025><Element5004>38.000</Element5004></MOA>  <!-- TVA -->
      <MOA><Element5025>128</Element5025><Element5004>239.000</Element5004></MOA> <!-- TTC -->
    </MOASECTION>
  </INVOICEBODY>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">...</ds:Signature>
</TEIF>
```

### 4.6.2 Décomposition du Matricule Fiscal

La méthode `SplitMatricule` décompose le MF en 4 champs TEIF :

| Champ | Positions | Longueur | Exemple |
|-------|-----------|----------|---------|
| ID_0088 | 1-8 | 8 car. | `1234567A` |
| ID_0089 | 9 | 1 car. | `P` |
| ID_0090 | 10 | 1 car. | `M` |
| ID_0091 | 11-13 | 3 car. | `000` |

### 4.6.3 Double implémentation (backend + frontend)

Le générateur XML existe en deux versions :

- **Backend** (`TeifGenerator.cs`) : utilisé lors de la signature électronique côté serveur ;
- **Frontend** (`teifGenerator.js`) : utilisé pour la prévisualisation et le téléchargement côté client.

Les deux implémentations produisent un XML structurellement identique.

## 4.7 Module d'Importation OCR (PDF/Image)

### 4.7.1 Architecture du module

Le composant `ImportInvoice.js` (373 lignes) permet l'importation de factures à partir de fichiers existants :

- **PDF** : extraction de texte via `pdfjs-dist` (bibliothèque Mozilla) ;
- **Images** (JPEG, PNG) : reconnaissance optique de caractères via `Tesseract.js` (langues : français + anglais).

### 4.7.2 Pipeline de traitement

1. **Upload** : sélection de fichier via input ou drag-and-drop ;
2. **Extraction** : selon le type de fichier :
   - PDF → `pdfjsLib.getDocument()` → extraction texte page par page ;
   - Image → `Tesseract.recognize()` → texte brut OCR ;
3. **Parsing heuristique** (`parseInvoiceText`) :
   - Détection du Matricule Fiscal via regex : `/\d{7}[A-Z]{3}\d{3}/` ;
   - Extraction des dates, numéros de facture, montants ;
   - Identification de l'émetteur et du destinataire ;
4. **Préremplissage** : les champs extraits alimentent le formulaire de création de facture ;
5. **Soumission** : l'utilisateur peut corriger et valider avant l'envoi à l'API.

## 4.8 Module de Statistiques et Tableau de Bord

### 4.8.1 Backend — Endpoints statistiques (`StatisticsController`)

Cinq endpoints fournissent les données analytiques :

1. **`GET /summary`** : KPI globaux (CA HT, volume factures, TVA totale, droit de timbre cumulé) calculés à partir des factures validées ;
2. **`GET /monthly-evolution`** : Évolution mensuelle comparée année en cours vs. année précédente, avec groupement par mois ;
3. **`GET /tva-distribution`** : Répartition de la TVA par taux, calculée à partir des lignes de factures avec pourcentage relatif ;
4. **`GET /top-clients`** : Top 5 des clients par CA, avec nombre de factures et total TTC ;
5. **`GET /tax-summary`** : Résumé fiscal mensuel détaillé avec ventilation par taux de TVA.

### 4.8.2 Frontend — Visualisations (`Statistics.js`)

Le composant `Statistics.js` (317 lignes) affiche :

- **4 cartes KPI** : CA global, volume de factures, TVA collectée, droit de timbre ;
- **Graphique d'évolution mensuelle** : graphique en lignes SVG (polylines) comparant 2 années, avec labels mensuels ;
- **Graphique en donut** : répartition de la TVA par taux (cercles SVG avec `stroke-dasharray`) ;
- **Classement des clients** : tableau des 5 meilleurs clients avec barres de progression proportionnelles.

Toutes les visualisations sont réalisées en **SVG pur** (sans bibliothèque graphique externe), ce qui garantit des performances optimales et l'absence de dépendances supplémentaires.

## 4.9 Module de Déclaration Fiscale

### 4.9.1 Fonctionnalité

Le composant `TaxDeclaration.js` (236 lignes) permet à l'utilisateur de consulter un résumé fiscal mensuel :

- **Sélecteur de période** : liste déroulante des 12 derniers mois ;
- **4 cartes récapitulatives** :
  - Chiffre d'Affaires HT ;
  - TVA Collectée (sur ventes) ;
  - TVA Déductible (sur achats — fonctionnalité prévue pour évolution future) ;
  - Net à Payer (TVA collectée + droit de timbre) ;
- **Tableau détaillé** : ventilation par taux de TVA avec base HT et montant de taxe ;
- **Nombre de factures** pour la période sélectionnée.

### 4.9.2 Logique de calcul côté serveur

L'endpoint `GET /api/Statistics/tax-summary` filtre les factures validées par société, mois et année, puis agrège :

- `totalCaHT` : somme des `TotalHT` ;
- `totalTva` : somme des `TotalTVA` ;
- `totalStamp` : somme des `StampDuty` ;
- `netToPay` : `totalTva + totalStamp` ;
- `details` : regroupement des `InvoiceLines` par `TvaRate` avec `baseHT` et `taxAmount`.

## 4.10 Module de Journal d'Activités

### 4.10.1 Enregistrement des activités

Le système trace automatiquement les actions importantes :

| Type | Déclencheur | Exemple |
|------|-------------|---------|
| `user_creation` | Création d'un utilisateur | « Admin a créé l'utilisateur Mohamed » |
| `invoice_creation` | Création d'une facture | « Mohamed a créé la facture FAC-2026-0001 » |
| `invoice_signature` | Signature électronique | « Système a signé la facture FAC-2026-0001 » |

### 4.10.2 Consultation

- **`GET /api/Activities/recent`** : 10 dernières activités (affiché dans le tableau de bord admin) ;
- **`GET /api/Activities`** : historique complet (accessible via modal dans le dashboard admin) ;
- **`POST /api/Activities`** : enregistrement manuel d'une activité.

## 4.11 Interfaces utilisateur réalisées

### 4.11.1 Page de connexion (`Login.js`)

- Design bicolore avec **carrousel automatique** (3 slides, auto-play 4s, swipe tactile) ;
- Formulaire de connexion avec champs e-mail/mot de passe ;
- Formulaire OTP pour la première connexion ;
- Formulaire d'inscription avec validation MF en temps réel ;
- Gestion des erreurs avec messages contextuels.

### 4.11.2 Tableau de bord utilisateur (`Dashboard.js`)

- **Barre latérale** avec navigation : Accueil, Gestion Facture, Déclaration Fiscale, Statistiques, Clients & Produits ;
- **En-tête** avec sélecteur de société (multi-entreprises), barre de recherche, notifications, profil ;
- **3 cartes statistiques** : factures validées, en attente, rejetées (cliquables pour filtrage) ;
- **Tableau historique** : 8 dernières factures avec tri par colonnes ;
- **Modal de détail** : visualisation complète d'une facture.

### 4.11.3 Tableau de bord administrateur (`AdminDashboard.js`)

- Interface complète de 1 113 lignes avec navigation dédiée ;
- **5 sections** : Dashboard, Gestion Utilisateurs, Gestion Sociétés, Certificats, Journal d'activités ;
- **Modales CRUD** pour utilisateurs et sociétés ;
- **Notifications** : compteur d'utilisateurs en attente de validation ;
- **KPI administratifs** : nombre total d'utilisateurs, sociétés, certificats.

---

# Chapitre 5 — Tests, Validation et Déploiement

## 5.1 Stratégie de test

La stratégie de test adoptée couvre plusieurs niveaux :

| Niveau | Type | Outils | Portée |
|--------|------|--------|--------|
| Unitaire | Tests composants | Jest, React Testing Library | Frontend (composants React) |
| Intégration API | Tests endpoints | Swagger UI, fichier `.http` | Backend (contrôleurs) |
| Fonctionnel | Tests end-to-end | Tests manuels | Scénarios métier complets |
| Conformité | Validation XML | Schéma XSD TEIF | Format XML généré |

## 5.2 Tests unitaires

Le frontend intègre le framework de test standard React :

- **Configuration** : `react-scripts test` avec Jest ;
- **Bibliothèques** : `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` ;
- **Fichier de test** : `App.test.js` (test de rendu de base) ;
- **Utilitaire** : `reportWebVitals.js` pour les métriques de performance.

## 5.3 Tests d'intégration API

Le fichier `backend.http` permet de tester les endpoints REST directement dans VS Code avec l'extension REST Client. Les tests couvrent :

- Authentification (login, register, verify-otp) ;
- CRUD complet pour chaque entité ;
- Cas limites (MF invalide, e-mail dupliqué, etc.) ;
- Documentation Swagger accessible à `http://localhost:5170/swagger`.

## 5.4 Tests fonctionnels (end-to-end)

Les scénarios fonctionnels suivants ont été testés manuellement :

| # | Scénario | Résultat |
|---|----------|----------|
| 1 | Inscription → Validation admin → Première connexion OTP | ✅ Fonctionnel |
| 2 | Création facture → Sauvegarde → Signature → Statut Validée | ✅ Fonctionnel |
| 3 | Import PDF → OCR → Parsing → Préremplissage | ✅ Fonctionnel |
| 4 | Multi-entreprises : création société → switch → données filtrées | ✅ Fonctionnel |
| 5 | Validation MF (13 car., format regex) côté client et serveur | ✅ Fonctionnel |
| 6 | Statistiques : KPI, graphiques, top clients | ✅ Fonctionnel |
| 7 | Déclaration fiscale mensuelle | ✅ Fonctionnel |
| 8 | Archivage utilisateur (soft delete) | ✅ Fonctionnel |
| 9 | Génération et téléchargement XML TEIF | ✅ Fonctionnel |
| 10 | Diagnostic erreur facture rejetée | ✅ Fonctionnel |

## 5.5 Validation de la conformité TEIF

Le XML généré a été validé selon les critères suivants :

| Critère | Vérification | Résultat |
|---------|-------------|----------|
| Namespace TEIF | `urn:tn:gov:dgi:teif:2.0` | ✅ Conforme |
| Version | `2.0` | ✅ Conforme |
| Controlling Agency | `TTN` | ✅ Conforme |
| Décomposition MF | ID_0088 à ID_0091 correctement mappés | ✅ Conforme |
| Codes document | 380 (Facture), 381 (Avoir) | ✅ Conforme |
| Codes taxe | I-1602 (TVA), I-1601 (Timbre), I-176 (Base) | ✅ Conforme |
| Codes montant | 79 (HT), 176 (TVA), 128 (TTC) | ✅ Conforme |
| Précision décimale | 3 décimales (millimes DT) | ✅ Conforme |
| Signature XAdES-EPES | QualifyingProperties, SigningCertificate, Policy | ✅ Conforme |

## 5.6 Scénarios de test détaillés

### Scénario 1 : Cycle complet de facturation

**Préconditions** : Utilisateur actif, société avec clients et produits.

| Étape | Action | Résultat attendu | Résultat obtenu |
|-------|--------|-------------------|-----------------|
| 1 | Connexion avec e-mail/mdp | Redirection vers Dashboard | ✅ OK |
| 2 | Navigation vers « Gestion Facture » | Affichage des onglets | ✅ OK |
| 3 | Clic « Création Manuelle » | Formulaire vierge avec numéro auto | ✅ OK |
| 4 | Sélection client depuis catalogue | Préremplissage MF et adresse | ✅ OK |
| 5 | Ajout de 2 lignes depuis produits | Calcul automatique HT/TVA/TTC | ✅ OK |
| 6 | Clic « Sauvegarder » | Facture créée, statut Brouillon | ✅ OK |
| 7 | Clic « Prévisualiser XML » | Affichage XML TEIF conforme | ✅ OK |
| 8 | Navigation vers liste → Signer | Signature XAdES → Statut Validée | ✅ OK |
| 9 | Vérification statistiques | KPI mis à jour | ✅ OK |
| 10 | Vérification déclaration fiscale | Montants cohérents | ✅ OK |

### Scénario 2 : Validation du Matricule Fiscal

| Entrée | Résultat attendu | Résultat obtenu |
|--------|-------------------|-----------------|
| `1234567APM000` | ✅ Valide | ✅ OK |
| `1234567/A/P/M/000` | ✅ Normalisé → `1234567APM000` | ✅ OK |
| `12345` | ❌ Invalide (< 13 car.) | ✅ OK |
| `1234567ZZZ000` | ✅ Valide (format correct) | ✅ OK |
| `ABCDEFGHIJKLM` | ❌ Invalide (pas de chiffres) | ✅ OK |

---

# Conclusion Générale et Perspectives

## Bilan du projet

Le présent projet de fin d'études a abouti au développement d'une plateforme de facturation électronique complète, fonctionnelle et conforme aux exigences du standard tunisien TEIF v2.0. L'application « El Fatoora » couvre l'ensemble du cycle de vie de la facture électronique, depuis la création jusqu'à la signature numérique, en passant par l'importation OCR et le suivi statistique.

Les principaux résultats obtenus sont :

1. **Une API REST robuste** composée de 8 contrôleurs et 37 endpoints, couvrant l'ensemble des besoins métier ;
2. **Une base de données relationnelle** bien normalisée avec 7 tables, des contraintes d'intégrité rigoureuses et un historique de 12 migrations ;
3. **Un système de signature électronique** XAdES-EPES fonctionnel, compatible avec les certificats X.509 utilisés par Tunisie TradeNet ;
4. **Un générateur XML TEIF** conforme aux spécifications officielles, avec double implémentation (backend C# et frontend JavaScript) ;
5. **Un module d'importation OCR** innovant permettant la numérisation de factures papier ;
6. **Une interface utilisateur moderne** et ergonomique, avec 13 composants React et des visualisations SVG personnalisées ;
7. **Un système d'authentification sécurisé** avec JWT, OTP et gestion de rôles.

## Compétences mobilisées

Ce projet a permis de mobiliser et d'approfondir des compétences dans de nombreux domaines :

- **Développement full-stack** : C# / ASP.NET Core (backend) et React / JavaScript (frontend) ;
- **Base de données** : Conception relationnelle, EF Core, migrations, requêtes LINQ ;
- **Sécurité** : Authentification JWT, cryptographie X.509, signature XML ;
- **Standards métier** : TEIF, XAdES, UN/CEFACT, fiscalité tunisienne ;
- **OCR et traitement de documents** : Tesseract.js, pdf.js ;
- **Architecture logicielle** : REST, MVC, SPA, séparation des responsabilités.

## Améliorations futures

Plusieurs axes d'amélioration ont été identifiés pour les versions futures :

### Sécurité
- **Hachage des mots de passe** : Implémenter BCrypt ou Argon2 pour le stockage sécurisé des mots de passe (actuellement stockés en clair) ;
- **Rafraîchissement des tokens** : Implémenter un mécanisme de refresh token pour éviter les sessions trop longues (actuellement 120 jours) ;
- **Rate limiting** : Protéger les endpoints sensibles contre les attaques par force brute.

### Fonctionnalités
- **Intégration TTN réelle** : Connecter l'application à l'API de production de Tunisie TradeNet pour la transmission effective des factures ;
- **TVA déductible** : Implémenter la gestion de la TVA sur achats pour un calcul complet de la déclaration fiscale ;
- **Archivage légal** : Mettre en place un système d'archivage conforme aux exigences réglementaires (10 ans) ;
- **Export PDF** : Générer des factures au format PDF pour impression et envoi client ;
- **Notifications push** : Alerter en temps réel les administrateurs des nouvelles inscriptions et les utilisateurs du statut de leurs factures.

### Architecture
- **Conteneurisation Docker** : Faciliter le déploiement avec Docker et Docker Compose ;
- **Tests automatisés** : Augmenter la couverture de tests avec des tests unitaires, d'intégration et end-to-end automatisés ;
- **CI/CD** : Mettre en place un pipeline d'intégration et de déploiement continu ;
- **Gestion d'état avancée** : Migrer vers Redux ou Zustand pour une gestion d'état plus robuste côté frontend.

### Performance
- **Pagination API** : Implémenter la pagination côté serveur pour les listes volumineuses ;
- **Mise en cache** : Utiliser Redis pour le cache des données fréquemment consultées ;
- **Optimisation des requêtes** : Ajouter des index de base de données pour les colonnes fréquemment filtrées.

---

# Annexes

## Annexe A — Structure complète du projet

```
pfe/
├── package.json                  ← Script racine (concurrently)
├── README.md
├── backend/                      ← API ASP.NET Core 8
│   ├── Program.cs
│   ├── appsettings.json
│   ├── backend.csproj
│   ├── Controllers/ (8 fichiers)
│   ├── Models/ (7 fichiers)
│   ├── Data/ (ApplicationDbContext.cs)
│   ├── DTOs/ (2 fichiers)
│   ├── Services/ (4 fichiers)
│   ├── Utils/ (TeifGenerator.cs)
│   ├── Migrations/ (12 migrations)
│   └── Certificates/ (TTN_Test.p12)
├── frontend/                     ← SPA React 19
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.js
│       ├── pages/ (13 composants)
│       ├── utils/ (2 utilitaires)
│       └── assets/ (3 images)
└── docs/                         ← Documentation
    └── Rapport_PFE_El_Fatoora.md
```

## Annexe B — Commandes utiles

```bash
# Installation des dépendances
cd frontend && npm install
cd backend && dotnet restore

# Lancement en développement
npm run dev                          # Frontend + Backend simultanément

# Migrations base de données
cd backend
dotnet ef migrations add NomMigration
dotnet ef database update

# Build production
cd frontend && npm run build
cd backend && dotnet publish -c Release
```

## Annexe C — Configuration de la base de données

```
Serveur  : 127.0.0.1
Port     : 3307
Base     : elfatoora_db
User     : java
Password : java
```

## Annexe D — Glossaire

| Terme | Définition |
|-------|------------|
| **TEIF** | Tunisian Electronic Invoice Format — format XML de facturation électronique tunisien |
| **TTN** | Tunisie TradeNet — opérateur national de la facturation électronique |
| **DGI** | Direction Générale des Impôts (Tunisie) |
| **XAdES** | XML Advanced Electronic Signatures — standard de signature électronique |
| **EPES** | Explicit Policy-based Electronic Signatures — profil XAdES avec politique explicite |
| **MF** | Matricule Fiscal — identifiant fiscal unique en Tunisie (13 caractères) |
| **JWT** | JSON Web Token — standard d'authentification pour les API REST |
| **OTP** | One-Time Password — mot de passe à usage unique |
| **OCR** | Optical Character Recognition — reconnaissance optique de caractères |
| **TVA** | Taxe sur la Valeur Ajoutée |
| **HT** | Hors Taxes |
| **TTC** | Toutes Taxes Comprises |
| **SPA** | Single Page Application — application web mono-page |
| **EF Core** | Entity Framework Core — ORM (Object-Relational Mapping) pour .NET |
| **CRUD** | Create, Read, Update, Delete — opérations de base sur les données |
| **CORS** | Cross-Origin Resource Sharing — politique de partage des ressources |
| **REST** | Representational State Transfer — style d'architecture pour les API web |
| **SMTP** | Simple Mail Transfer Protocol — protocole d'envoi d'e-mails |

---

*Rapport généré le 15 avril 2026 — Projet de Fin d'Études « El Fatoora »*
