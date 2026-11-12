# 1. Analyse du projet : fonctionnalités serveur et données

## Point de départ

Le site Power Website est aujourd'hui **entièrement statique** : HTML, CSS et JavaScript exécutés dans le navigateur. Rien n'est conservé quand l'utilisateur quitte la page. Les formulaires envoient leurs données à une API de démonstration (JSONPlaceholder) qui répond « OK » sans rien enregistrer, et la connexion est simulée.

## Quelles fonctionnalités ont besoin d'un serveur ?

Une fonctionnalité a besoin d'un serveur quand elle doit **conserver** des données, **vérifier** quelque chose de façon sûre, ou **partager** des informations entre plusieurs visiteurs.

| Fonctionnalité | Page | Situation actuelle | Serveur ? | Pourquoi |
|---|---|---|---|---|
| **Formulaire de contact** | `contact.html` | Envoyé à une API de démonstration, rien n'est enregistré | **Oui** | Recevoir, vérifier et conserver les messages pour que l'équipe puisse y répondre |
| Inscription (quiz) | `index.html` | API de démonstration | Oui | Créer un compte, vérifier que l'email n'est pas déjà utilisé |
| Connexion | `connexion.html` | Simulée | Oui | Vérifier l'email et le mot de passe, savoir qui est connecté |
| Abonnements | `accueil.html` | Les boutons renvoient vers le quiz | Oui | Enregistrer qui a choisi quelle formule |
| Programmes | `accueil.html`, `programmes.html` | Texte écrit en dur dans le HTML | Optionnel | Pouvoir les modifier sans toucher au code |
| Calculateur IMC / besoins | `accueil.html` | Calcul dans le navigateur | Non (le calcul) | Seule la sauvegarde d'un historique demanderait un serveur |
| Police dyslexie, pause vidéo, validation regex, graphique | toutes | Dans le navigateur | Non | Ce sont des préférences ou des affichages locaux |

## Ordre de développement proposé

1. **Formulaire de contact** (fait cette semaine, Node.js natif).
2. Base de données réelle (tables `messages_contact`, `objectifs`, `formules`, `programmes`) et lecture des programmes.
3. Inscription (table `utilisateurs`).
4. Connexion et sécurité des mots de passe.
5. Souscription aux formules.
6. Sauvegarde des bilans du calculateur (facultatif).

Le formulaire de contact est le meilleur point de départ : il est simple, n'a pas besoin de compte utilisateur, et permet de mettre en place toute la structure du backend (routes, contrôleurs, modèles, validation, erreurs) qui servira ensuite aux autres fonctionnalités.

## Données nécessaires à l'application

| Donnée | Utilisée pour | Table |
|---|---|---|
| Nom, email, sujet, message, date, statut de traitement | Messages du formulaire de contact | `messages_contact` |
| Prénom, email, mot de passe (sous forme de **hash**), rôle, date d'inscription | Comptes des visiteurs | `utilisateurs` |
| Objectifs : perte de poids, musculation, nutrition | Choix du quiz, classement des programmes | `objectifs` |
| Titre, description, image, objectif visé | Programmes du site | `programmes` |
| Nom, prix mensuel, description, « populaire » | Abonnements Découverte, Basic, Premium | `formules` |
| Utilisateur, formule, dates de début et de fin, statut | Souscriptions | `souscriptions` |
| Poids, taille, âge, sexe, objectif, IMC, calories, macronutriments | Historique du calculateur | `bilans` |

Le schéma complet (MCD, MLD, dictionnaire de données) est dans [`02-base-de-donnees.md`](02-base-de-donnees.md).

## Points à valider avec l'enseignante

- **Choix du système de base de données** (PostgreSQL, MySQL/MariaDB ou SQLite). Le script SQL est écrit pour PostgreSQL et indique comment l'adapter à MySQL.
- **Stockage provisoire** : pour cette première étape, les messages sont écrits dans un fichier JSON (`backend/data/messages.json`), avec exactement les champs de la table `messages_contact`. Le jour où la base est branchée, seul `models/contact.model.js` change.
- **Mot de passe à l'inscription** : le formulaire du quiz ne demande aujourd'hui que le prénom et l'email. Il faudra ajouter un mot de passe pour que la connexion ait un sens (étape 3).
