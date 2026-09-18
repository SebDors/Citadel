# Original User Request

## 2026-09-17T12:57:09Z

# Teamwork Project Prompt

Refonte spatiale totale de l'application Citadel, rompant définitivement avec les conventions des applications de fitness génériques (zéro carte, zéro barre d'onglets inférieure classique, zéro widget calendrier 31 cases, zéro scroll vertical d'exercices à l'entraînement). L'ergonomie adopte l'International Typographic Style (Müller-Brockmann, Kinfolk, Apple Fitness+) fondé sur de grands espaces négatifs, des contrastes typographiques monumentaux et des lignes directrices ultra-fines.

Working directory: c:\Users\AY030031\Documents\Citadel
Integrity mode: development

## Requirements

### R1. Autopsie Critique & Directives Spatiales (Phase 0)
- Création du document POSTMORTEM_ET_NOUVELLE_ARCHITECTURE_SUISSE.md.
- Analyse sans concession des biais des itérations passées (empilement vertical de cartes, conservation inconsciente du layout initial).
- Formalisation du contrat de rupture spatiale et des mandats stricts d'interface.

### R2. Design Tokens Suisses & Échelle Typographique Monumentale
- Fichier de tokens src/constants/swissTheme.ts et intégration dans src/constants/theme.ts et colors.ts.
- Palette monochrome haute tension : noir charbon #0A0A0A (clair #F6F6F4), séparateurs de grille ultra-fins 0.5px/1px #262626 (#E5E5E5), texte pur #FFFFFF (#0F0F0F), métadonnées #737373.
- Accent unique Swiss Crimson (#E63946 / #FF2A2A) réservé exclusivement à un point focal à la fois (confirmation, timer actif, repère d'étape).
- Échelle typographique monumentale : titres 44px à 64px sans-serif robuste, chiffres télémétriques bruts, labels 10px-11px avec espacement large (letterSpacing: 1.5px). Suppression intégrale des Card fermées à bordures épaisses au profit d'espaces négatifs et de hairlines.

### R3. Système de Navigation Typographique en Index Haut
- Élimination définitive de la barre de navigation inférieure à 3 onglets.
- Remplacement par une pagination typographique en en-tête ou sélecteur supérieur :  
  01 SESSION  |  02 JOURNAL  |  03 ARCHIVE & DATA
- Navigation par tap ou glissement horizontal (swipe), avec mise en valeur typographique pure (soulignement crimson ou contraste blanc/gris) de l'index actif.

### R4. Écran d'Accueil : Le Manifeste d'Entraînement
- Élimination de la rangée de boutons en haut et des listes de cartes génériques.
- En-tête éditorial géant : indicateur d'état courant monumental (ex: CURRENT STATUS: READY TO ENGAGE ou volume hebdo en 56px).
- Zone session immédiate : grande zone tactile occupant une part majeure de l'écran avec typographie directe → LANCER ENTRAÎNEMENT LIBRE.
- Zone protocoles sous forme d'index de livre : ligne ultra-fine, numéro d'index rouge (01), titre de séance en grand texte gras, groupes musculaires ciblés alignés à droite, et entrée d'index [+ ÉCRIRE UN PROTOCOLE].

### R5. Séance en Direct : "Stage Viewport" Horizontal
- Élimination du défilement vertical infini d'exercices.
- Implémentation du mode "Stage Viewport" : un exercice à la fois avec navigation horizontale fluide (indicateurs d'étape STAGE 01 OF 04).
- En-tête avec horodatage minimaliste géant (24:18), charge cumulée et séries (08 / 18).
- Matrice des séries épurée : SET | PREVIOUS | KG | REPS | RIR sans boîtes ni gros inputs, chiffres soulignés d'un trait fin de 1px.
- Validation par tap sur la ligne avec biffure typographique ou trait rouge net marquant la complétion, et surimpression fluide du chronomètre de repos.
- Menu d'actions minimaliste OPTIONS // en pied d'exercice.

### R6. Historique & Données : Le Journal Chronologique
- Élimination du widget calendrier mensuel à cases.
- Frise chronologique typographique (Journal Ribbon) : dates monumentales sur le fil gauche (14 SEP, 12 SEP), résumé type article de presse avec records et tonnage.
- Tête d'écran avec métriques géantes séparées par un trait vertical fin : WEEK: XX KG  |  MONTH: XX KG.
- Section Données & Export : liens typographiques directs sobres ([ EXPORTER LA BASE COMPLÈTE EN JSON ], [ COPIER LES DONNÉES AU FORMAT PRESSE-PAPIER ], [ RESTAURER UN FICHIER EXTERNE ]).

## Acceptance Criteria

### Rupture Spatiale & Architecture
- [ ] Aucune "Card" fermée avec fond gris et bordures épaisses n'est présente sur les écrans principaux.
- [ ] La barre d'onglets inférieure classique est supprimée au profit du système de pagination en index typographique supérieur (01 SESSION | 02 JOURNAL | 03 ARCHIVE & DATA).
- [ ] L'écran d'entraînement en direct présente les exercices via un Stage Viewport horizontal (un exercice focal à la fois) et non un scroll vertical infini.
- [ ] L'historique n'affiche aucun calendrier mensuel à 31 cases, mais un Journal Ribbon chronologique asymétrique.

### Design Tokens & Rigueur Suisse
- [ ] Espaces négatifs prédominants (30 à 40% de vide), alignement strict à gauche, hairlines de séparation 0.5px à 1px.
- [ ] Palette monochrome rigoureuse avec pour seul accent le Swiss Crimson (#E63946 / #FF2A2A).
- [ ] Typographie contrastée avec titres monumentaux (44px+) et labels micro-typographiques espacés (10-11px).

### Qualité Technique & Workflow Git
- [ ] Branche dédiée : design/revamp-v3-swiss-minimal.
- [ ] Commits conventionnels stricts respectant la liste imposée :
  1. docs(critique): add spatial post-mortem and swiss layout guidelines
  2. feat(tokens): define swiss typography scale and high-contrast monochrome tokens
  3. refactor(nav): replace bottom tabs with typographic index pagination
  4. feat(dashboard): rebuild home as an editorial monograph (zero cards, zero top buttons)
  5. feat(workout): implement horizontal stage-based workout viewport (no vertical card scroll)
  6. feat(history): replace calendar box with typographic chronological ledger
  7. test(qa): check strict types and bundle on expo sdk 54
- [ ] Tag git final créé : Citadel-SwissMinimal.
- [ ] Compilation TypeScript sans aucune erreur (node node_modules/typescript/bin/tsc --noEmit code 0).
- [ ] Expo SDK 54 STRICTEMENT préservé (expo@~54.0.0) sans régression de dépendance ni perte de logique métier (AsyncStorage, chronomètres, calculs de tonnage, exports/imports JSON).
