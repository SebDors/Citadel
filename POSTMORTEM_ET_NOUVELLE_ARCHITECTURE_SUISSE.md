# AUTOPSIE CRITIQUE & DIRECTIVES SPATIALES // STYLE TYPOGRAPHIQUE SUISSE

**Application :** Citadel Mobile (Expo SDK 54 / Android & iOS)  
**Branche Git :** `design/revamp-v3-swiss-minimal`  
**Date :** 18 Septembre 2026  
**Inspiration :** Josef Müller-Brockmann, Max Bill, Dieter Rams, Kinfolk Magazine, Apple Fitness+ Editorial  

---

## 1. POST-MORTEM DES ITÉRATIONS PASSÉES

### Le Piège du "Card Stacking" et du Skeuomorphisme Déguisé
Les itérations précédentes, bien qu'améliorant les palettes de couleurs, ont conservé le squelette conventionnel d'une application mobile générique :
- **Des cartes partout** : Des conteneurs grisés ou noirs avec bordures fermées qui emprisonnent l'information et gaspillent jusqu'à 30% de l'espace utile en bordures et marges intérieures.
- **La barre d'onglets inférieure flottante** : Trois icônes vectorielles génériques avec badges flottants qui attirent inutilement l'œil et cassent la pureté de la page.
- **Le défilement infini pendant l'entraînement** : Faire scroller 6 à 10 exercices de haut en bas pendant une séance intense crée une surcharge cognitive et une perte de concentration.
- **Le widget calendrier 31 cases** : Un pavé compact hérité des applications de bureau, inadapté à la consultation fluide d'une progression athlétique.

---

## 2. LES 5 COMMANDEMENTS DU MINIMALISME SUISSE POUR CITADEL

1. **Zéro Carte / Zéro Conteneur Fermé** :  
   Suppression absolue de tout conteneur délimité par des aplats ou des bordures de boîtes. L'organisation spatiale repose exclusivement sur **l'espace négatif généreux** (multiples de 8px : 16, 24, 32, 48, 64px) et des **hairlines ultra-fines (0.5px à 1px)**.
2. **Hiérarchie Typographique Monumentale** :  
   Des chiffres clés et des titres géants (44px à 64px) alignés au millimètre à gauche. L'information s'impose par sa taille et son poids, jamais par des artifices graphiques.
3. **Police Neo-Grotesque Neutre & Espacements Rigoureux** :  
   Utilisation d'une typographie sans-serif neutre (System Sans-Serif / Inter / Helvetica). Letter-spacing négatif sur les titres monumentaux (-0.5px à -1.5px) pour densifier l'impact, et letter-spacing positif étiré (+1.5px) sur les micro-labels majuscules (10px - 11px).
4. **Grille Asymétrique & Numérotation Éditoriale** :  
   Chaque section ou élément est indexé par un chiffre rouge suisse vif (`01`, `02`, `03`), rappelant les sommaires des grandes revues d'architecture et de design suisses.
5. **Swiss Crimson (#FF2A2A) : L'Accent Unique** :  
   Une seule couleur d'accent dans toute l'application. Utilisée exclusivement pour le point focal actif (soulignement d'onglet, bouton actif, validation de série barrée, décompte de chronomètre).

---

## 3. ARCHITECTURE SPATIALE PAR ÉCRAN

### A. Navigation : Index Typographique Supérieur
- Suppression du dock inférieur.
- En-tête d'écran avec pagination typographique épurée :  
  `01 SÉANCE | 02 JOURNAL | 03 DONNÉES`
- L'onglet actif est souligné d'un filet rouge suisse vif `#FF2A2A` de 2px ou contrasté en blanc pur `#FFFFFF` face au gris `#737373`.

### B. Écran Principal : Le Manifeste d'Entraînement
- **En-tête Statut** : Affichage typographique géant `STATUS // READY` avec volume cumulé hebdomadaire en corps monumental 56px.
- **Déclencheur d'Entraînement** : Immense zone typographique pleine largeur :  
  `→ DÉMARRER ENTRAÎNEMENT LIBRE` (texte pur, corps 26px, flèche rouge, sans boîte).
- **Sommaire des Programmes** : Lignes de séparation ultra-fines de 1px, index rouge `01`, `02`, titre de routine en gras grand format (20px), groupes musculaires en petits labels discrets à droite.
- Lien discret : `[+ CRÉER UN PROGRAMME]`.

### C. Séance en Direct : "Stage Viewport" Horizontal
- **Interdiction du scroll vertical d'exercices** : Affichage d'un seul exercice à la fois.
- **En-tête Télémétrique** : Chrono géant (24:18), volume cumulé et compte de séries (08 / 18).
- **Barre d'Étape Horizontale** : Tirets/puces cliquables permettant de glisser ou basculer d'un exercice à l'autre d'une simple tape.
- **Matrice des Séries** : Tableau épuré délimité par des traits fins horizontaux de 1px (`SET`, `PREVIOUS`, `KG`, `REPS`, `RIR`). La complétion barre sobrement la ligne ou l'illumine d'un trait rouge `#FF2A2A` et déclenche le minuteur de repos.
- Menu contextuel : `OPTIONS //` discret en pied d'exercice.

### D. Historique : Journal Chronologique Continu
- Suppression du calendrier 31 cases.
- **Bandeau Télémétrique Supérieur** : `SEMAINE: 18,400 KG | MOIS: 72,100 KG` séparés par un trait fin.
- **Frise Chronologique Asymétrique** : Dates monumentales à gauche (`18 SEP`, `15 SEP`), nom de la séance en vis-à-vis, charges max et volume total.

### E. Données & Export
- Liens typographiques directs :  
  `[ COPIER LE JSON DANS LE PRESSE-PAPIER ]`  
  `[ PARTAGER LE FICHIER .JSON ]`  
  `[ IMPORTER UNE SAUVEGARDE EXTERNE ]`

---

## 4. CONTRAT TECHNIQUE & CONFORMITÉ
- **Expo SDK 54 STRICT** (`expo@~54.0.0`).
- **Compilation TypeScript Strict** : Code 0 (`tsc --noEmit`).
- **Zéro Régression Métier** : AsyncStorage offline, RIR, timers, JSON export/import.
