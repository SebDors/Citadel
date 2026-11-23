🎉 Nouveautés de la version 1.8.0 :

⚡ Architecture, Performances & Fiabilité
- Migration complète vers une base de données locale SQLite relationnelle indexée (sauvegardes instantanées, table incrémentale des records PR et historique virtualisé sans troncature).
- Découpage modulaire de l'état (Zustand), écran de récupération en cas d'erreur (`ErrorBoundary`) et retrait de la permission Android inutile `RECORD_AUDIO`.

🧭 Navigation & Ergonomie
- Swipe natif fluide entre les onglets principaux avec indicateur visuel de l'onglet actif.
- Minuteur de repos persistant accessible depuis tous les onglets et retours haptiques natifs sur les séries, minuteurs et circuits.
- Réorganisation tactile par glisser-déposer (Drag & Drop) des exercices et blocs.
- Menu de séance simplifié, confirmation systématique lors de la suppression d'une série et réorganisation claire des Paramètres.

🗓️ Planification & Cardio
- Planificateur hebdomadaire (*Weekly Split Scheduler*) intégrant les séances de musculation et les modèles cardio.
- Création, modification et suppression de modèles de séances cardio ainsi que gestion complète (CRUD) des activités cardio personnalisées.

🏋️ Entraînement, Charges & Poids de Corps
- Fourchettes de répétitions (*Rep Ranges*) configurables dans les modèles et en séance live.
- Générateur automatique d'échauffement progressif.
- Amélioration du pavé numérique PDC (`+/-`), coefficients biomécaniques de poids de corps pour le tonnage réel et affichage détaillé dans l'historique (`PDC + X kg (total)`).
- Ajout des exercices Planche Latérale et Planche Latérale Dynamique.

📊 Analyses, Graphiques & Mensurations
- Jauge anti-blessure **ACWR** (Ratio Charge Aiguë / Chronique) avec infobulle explicative et graphique Radar d'équilibre musculaire (repliable) intégrant les muscles secondaires (0.5) et les circuits.
- Fiche détail d'exercice repensée : courbes lissées (Charge Max & 1RM Estimé ajusté au RIR) interactives au toucher et records au Poids de Corps.
- Choix de la formule de calcul du 1RM dans les paramètres (Epley par défaut, Brzycki, Lander, Wathen).
- Suivi du taux de masse grasse (%), indicateurs de défilement sur les graphiques de mensurations et recherche/filtres dans l'historique (`Tous`, `Muscu`, `Cardio`).

💾 Sauvegarde & Importation
- Import universel CSV depuis **Strong**, **Hevy** et **Citadel**.
- Sauvegarde locale quotidienne rotative et séparation claire Sauvegarde / Exportation dans les réglages.

---

🎉 Nouveautés de la version 1.7.4 :

📏 Mensurations — Tour de Taille & Suivi Graphique
- Intégration du tour de taille (`waistCm`) dans la saisie des mensurations et l'historique (`T xx.x`).
- Nouvelle métrique et courbe d'évolution graphique dédiée au tour de taille dans l'onglet Profil.
- Prise en compte et synchronisation complète lors de la modification d'un enregistrement corporel.

🔄 Remplacement d'Exercice & Préservation des Notes
- Rechargement anatomique propre lors du changement d'exercice (en séance live ou dans l'éditeur de templates) : mise à jour instantanée du muscle principal, des muscles cibles, de la sous-région et des fractions de ciblage.
- Réinitialisation propre des consignes techniques de l'ancien exercice tout en conservant intactes les observations typées (`sessionNotes`) de votre séance en cours.

⏱️ Raison d'Exception : Manque de Temps
- Ajout de la cause "Manque de temps" (`contrainte_temps`) parmi les motifs de séance exceptionnelle.
- Marquage facile des séances raccourcies ou adaptées par contrainte horaire afin d'éviter de polluer vos charges de référence ("Previous") sur le programme régulier.

💪 Harmonisation du Référentiel Musculaire
- Ajustement anatomique du Curl Marteau (*Hammer Curl*) : ciblage principal sur le Biceps (Brachial, 1.0) et secondaire sur les Avant-bras (Brachioradial, 0.5).

---

🎉 Nouveautés de la version 1.7.3 :

📏 Mensurations Libres & Flexibilité Totale
- Suppression du caractère obligatoire du poids lors de la saisie ou de la modification d'une mesure corporelle.
- Enregistrement flexible : saisissez uniquement vos mensurations (poitrine, cuisse, bras) ou votre poids, selon vos préférences, sans aucune contrainte de champ obligatoire.
- Pré-remplissage et synchronisation automatique de l'enregistrement lors de la sélection d'une date existante.

---

🎉 Nouveautés de la version 1.7.2 :

🔧 Correctif Remplacement d'Exercice & Previous Fantôme
- Lors du remplacement d'un exercice en cours de séance, si le nouvel exercice n'a jamais été pratiqué auparavant, la valeur "Previous" est désormais correctement vide (`-`) au lieu de conserver par erreur celle de l'ancien exercice remplacé.
- Si le nouvel exercice a déjà été réalisé dans votre historique, ses véritables performances antérieures sont bien chargées comme prévu.
- Réinitialisation propre des notes de séance et des métadonnées lors d'une substitution pour éviter toute incertitude ou confusion.

---

🎉 Nouveautés de la version 1.7.1 :

🏷️ Notes Typées & Alertes Douleur
- Catégorisation rapide de vos observations de séance : Performance (cyan), Douleur (rouge), Contexte (ambre), Technique (violet) et Autre.
- Gestion du niveau de sévérité de 1 à 3 pour quantifier précisément une douleur ou gêne.
- Alerte discrète sur l'icône de note et affichage dédié des étiquettes sous l'exercice sans encombrer le titre.
- Séparation claire dans la modale de note entre "Observations de la séance" (datées et typées) et "Consigne technique permanente".
- Possibilité d'ajouter des notes typées au niveau global de la séance (via le menu Outils en séance live).

⚡ Flag de Séance Exceptionnelle & Anti-Pollution du Previous
- Marquez vos séances atypiques (contrainte de matériel, manque de temps/fatigue, séance partagée, test de charge, blessure) comme "séance exceptionnelle".
- Protection automatique de vos repères : les séances exceptionnelles sont ignorées par le calcul du "Previous" afin de ne pas fausser vos charges de référence sur le programme habituel.
- Activation en un clic lors de la fin de séance ou rétroactivement en modifiant une séance dans l'historique.
- Badges visuels d'exception et de douleur intégrés dans la liste de l'historique et sur le calendrier.

📊 Filtre d'Exception dans l'Onglet Analyse
- Nouvel interrupteur "Exclure les séances exceptionnelles" en haut de l'onglet Analyse pour isoler votre progression sur le programme pur.
- Recalcul instantané du volume musculaire hebdomadaire, des marqueurs de fatigue et des records 1RM.
- Consultation de l'historique de chaque exercice avec affichage des badges d'exception et des observations typées.

---

🎉 Nouveautés de la version 1.7.0 :

📊 Nouvel onglet "Analyse"
- Centralisation complète de vos analyses : Volume Musculaire Hebdomadaire, Marqueur de Fatigue et Records Personnels (PR & e1RM).
- Présentation harmonisée et lisible avec cartes au format et à la largeur unifiés.
- Nouvelle infobulle interactive détaillant le calcul du volume musculaire et les recommandations de volume.
- Onglet Profil allégé et recentré sur vos mensurations et données corporelles.

🥊 Suivi Cardio & Activités Dédiées
- Enregistrez vos séances d'activités complémentaires (Boxe, Course, Vélo, etc.) avec durée, perception d'effort (RPE) et notes.
- Intégration complète dans le calendrier d'historique avec bouton de saisie rapide par journée.
- Édition complète des séances cardio existantes depuis l'historique et le calendrier.
- Affichage du temps cumulé hebdomadaire en format lisible (ex: "1h30min" ou "45 min").

⚖️ Support Poids de Corps (PDC) & Tonnage Réel
- Nouveau bouton PDC directement intégré dans l'en-tête du pavé numérique : saisie ultra-rapide à 0ms de latence.
- Gestion du lest additionnel (+X kg) ou de l'allègement (-X kg) avec prise en compte de votre poids de corps dans le tonnage total réel de la séance.

🎯 Auto-régulation RIR en Direct
- RIR cible configurable par série avec indication "fantôme".
- Toast de conseil RIR contrasté et percutant dès la validation de votre série pour adapter votre intensité en temps réel.
- Option dans les paramètres pour activer ou désactiver les conseils RIR.

⚡ Améliorations de l'Entraînement en Direct
- Modale stylisée de confirmation avant de terminer la séance pour éviter toute fermeture involontaire.
- Maintien strict de l'ordre personnalisé des exercices lors de l'ajout ou suppression de séries.
- Abandon de séance fiable et instantané avec nettoyage immédiat des données en cours.

🧬 Référentiel Musculaire & Bibliothèque d'Exercices
- Harmonisation stricte de la base d'exercices sur 6 grandes catégories et 20 muscles anatomiques propres.
- Gestion dédiée des faisceaux et sous-régions musculaires.
- Élimination des doublons et alignement de la sauvegarde complète.
