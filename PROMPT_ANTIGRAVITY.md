# PROMPT D'INITIALISATION : FIT-TRACKER POC (EXPO SDK 54 & MULTI-AGENTS)

## ROLE & ORCHESTRATION GÉNÉRALE

Tu es l'**Agent Principal (Orchestrateur & Architecte)** sur Antigravity 2.0 sous Linux Fedora^^.
Ton rôle est de piloter le développement d'une application mobile de suivi de musculation type Epilog^^.

### CONTRAT D'EXÉCUTION ET DÉLÉGATION À DES SOUS-AGENTS

Pour éviter les erreurs et garder un contexte propre, **tu DOIS obligatoirement déléguer chaque sous-tâche à des sous-agents spécialisés**^^ :

1. `@Subagent-Research` : Veille Web et benchmarking d'Epilog (`epilog.fit`)^^.
2. `@Subagent-DevOps` : Initialisation CLI sur Fedora Linux, configuration **EXPO SDK 54 OBLIGATOIRE**^^.
3. `@Subagent-Git` : Gestion du dépôt Git, création de branches, suivi des fichiers modifiés et rédaction de commits sous la convention _Conventional Commits_ (`feat:`, `fix:`, `style:`, `refactor:`).
4. `@Subagent-Backend-Data` : Modélisation des données TypeScript, stockage local _Offline-First_ et moteur d'Export/Import JSON^^.
5. `@Subagent-Frontend-UI` : Développement des composants React Native, des thèmes visuels et de l'ergonomie^^.
6. `@Subagent-QA-Tester` : Vérification du typage TypeScript, validation du build Expo SDK 54 et démarrage du serveur de dev.

## CONTRAINTE TECHNIQUE STRICTE : EXPO SDK 54

L'application **DOIT IMPÉRATIVEMENT être initialisée sous Expo SDK 54** (`expo@~54.0.0`)^^. Aucune version ultérieure ne doit être installée pour assurer la compatibilité totale avec l'application Expo Go installée sur le mobile (Samsung S25 Edge).

## CHARTE GRAPHIQUE ET PALETTES DE COULEURS

L'application doit intégrer un système de thème (Dark Mode par défaut + Light Mode) respectant scrupuleusement les codes hexadécimaux suivants :

### Dark Mode (Par défaut) :

- Accent principal / Validation : `#9CB080`
- Secondaire / Éléments actifs : `#618764`
- Surface des cartes & conteneurs : `#2B5748`
- Arrière-plan principal (Background) : `#273338`

### Light Mode :

- Texte principal & Titres : `#2E2910`
- Cartes & Bordures : `#2C5745`
- Arrière-plan principal : `#EBE3A7`
- Accent / Boutons d'action : `#EB7D00`

## PHASE 1 : BENCHMARK & RECHERCHE WEB (`@Subagent-Research`)

Avant de générer du code, effectue des recherches Web sur :

1. Les flux utilisateurs d'Epilog (`epilog.fit`) : gestion des séries, RIR (Reps in Reserve), supersets, minuteurs^^.
2. Les APIs d'Export/Import JSON sous Expo SDK 54 avec `expo-file-system`, `expo-sharing` et `expo-clipboard`.

## PHASE 2 : PLAN D'ARCHITECTURE (`PLAN_ARCHITECTURE.md`)

L'Orchestrateur génère un fichier Artefact `PLAN_ARCHITECTURE.md` récapitulant :

- Le résumé des recherches Epilog^^.
- La modélisation TypeScript des données (Exercices, Séances, Séries, Mesures, Profil).
- L'arborescence complète du projet.
- Le calendrier des commits prévus par `@Subagent-Git`.

## PHASE 3 : SPÉCIFICATIONS DES ÉCRANS & NAVIGATION (`@Subagent-Frontend-UI`)

La navigation principale s'effectue via une barre d'onglets inférieure ( **Bottom Navigation Bar** ) comprenant 3 menus :

### ONGLET 1 : ENTRAÎNEMENT (ÉCRAN PRINCIPAL)

- **Haut de page :** Deux boutons d'action principaux côte à côte :
  1. `[Lancer un entraînement libre]` (démarre immédiatement une séance vierge où l'on ajoute des exercices à la volée).
  2. `[Créer une séance]` (ouvre un éditeur pour pré-enregistrer un programme/template).
- **Corps de page :** Une liste sous forme de **Cartes (Cards)** affichant les séances pré-enregistrées (Titre, muscles ciblés, nombre d'exercices, bouton pour démarrer).

### ONGLET 2 : HISTORIQUE

- **Haut de page :** Un composant Calendrier affichant le mois en cours. Les jours où une séance a été effectuée sont marqués par des **puces (points de couleur)** sous la date.
- **Milieu de page :** Un bloc de statistiques résumant l'activité :
  - Récapitulatif de la **Semaine en cours** (Nombre de séances, Volume total en kg, Temps total).
  - Récapitulatif du **Mois en cours** .
- **Bas de page :** Liste chronologique des derniers entraînements effectués sous forme de cartes avec le nom de la séance, la date exacte et un résumé du volume.

### ONGLET 3 : PERFORMANCES & PROFIL

- **Section Profil (Haut) :** Carte d'en-tête avec la photo/avatar, le Nom de l'utilisateur et des informations clés (ex: Poids actuel, Nombre total de séances).
- **Section Graphiques de Performance :** Cartes affichant un graphique de progression de charge (ex: Évolution du 1RM sur le Développé Couché).
- **Section Historique des Mesures :** Cartes de suivi du poids et des mensurations corporelles avec graphiques d'évolution^^.
- **Zone Réglages & Données JSON :** Boutons d'accès rapide pour `[Exporter en JSON (Presse-papier)]`, `[Partager le fichier JSON]` et `[Importer un JSON]`.

### ÉCRAN DÉTAILLÉ : SÉANCE EN DIRECT (WORKOUT TRACKER)

Lorsqu'une séance est lancée (libre ou pré-enregistrée), l'écran affiche :

1. **Carte d'En-tête de Séance (Fixe en haut) :**
   - Titre de la séance.
   - Chronomètre du temps écoulé (_Elapsed time_ : hh:mm:ss).
   - Volume total soulevé (calculé en direct en kg).
   - Compteur de séries complétées (ex: `10/22 sets`).
2. **Cartes d'Exercices (Liste défilante) :**
   - **En-tête de l'exercice :** Nom de l'exercice, vignette/image miniature d'illustration, badge indiquant le temps de repos préconisé.
   - **Menu d'options de l'exercice (Bouton `...`) :**
     - Remplacer l'exercice par un autre.
     - Dupliquer l'exercice.
     - Ajouter une note.
     - Convertir en **Superset** avec un autre exercice^^.
     - Modifier le temps de repos.
     - Retirer l'exercice.
   - **Tableau des Séries :**
     - **Ligne d'en-tête :** Set # | Previous (ex: `100kg x 8`) | Kg | Reps | RIR | Validation.
     - **Saisie par série :** Champs d'entrée rapides pour le Poids (Kg), les Répétitions (Reps) et le RIR (_Reps In Reserve_ : nombre de reps conservées sous la barre).
     - **Types de Séries modifiables :** `Normale`, `Échauffement`, `Drop set`, `AMRAP`, `Échec`^^.
     - **Validation :** Dès que Kg, Reps et RIR sont remplis, l'utilisateur coche la case : la ligne passe en état "Complétée" (changement de couleur) et déclenche immédiatement le minuteur de repos^^.
   - **Bouton `[+ Ajouter une série]`** sous chaque exercice.

## PHASE 4 : DÉLÉGATION ET SUIVI PAR L'AGENT GIT (`@Subagent-Git`)

L'agent `@Subagent-Git` doit intervenir à chaque étape clé du projet :

1. Initialiser le dépôt Git (`git init`).
2. Créer une branche principale `main` et une branche de développement `feature/poc-v1`.
3. Après chaque intervention d'un sous-agent (DevOps, Data, Frontend), exécuter un `git status`, inspecter le `diff`, puis créer un commit structuré.
4. **Convention de commit obligatoire :**
   - `chore(sys): init project with expo sdk 54`
   - `feat(data): add typescript interfaces and local storage service`
   - `feat(ui): implement dark/light theme and tab navigation`
   - `feat(workout): add live workout tracker with RIR and supersets`
   - `feat(json): implement export to clipboard and file sharing`

## PHASE 5 : VALIDATION ET PRÉPARATION AU TEST (`@Subagent-QA-Tester`)

1. Vérifier le typage TypeScript avec `npx tsc --noEmit`.
2. Démarrer le serveur de développement via `npx expo start`.
3. Confirmer l'absence d'erreurs de bundling Expo SDK 54^^.
4. Afficher le QR Code final à scanner sur le Samsung S25 Edge via l'application Expo Go.
