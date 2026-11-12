# Power Website

Site de coaching sportif en ligne : quiz d'objectif, programmes, abonnements, calculateur IMC / besoins, contact et connexion.
Le projet comprend un **frontend** (HTML, CSS, JavaScript) et un **backend** Node.js natif (module `http`, sans Express ni autre framework).

**Site en ligne : _à compléter avec l'URL de déploiement_**

## Prérequis

- **Node.js 18 ou plus** (développé et testé avec Node 22). Vérifier avec `node --version`. L'installation de Node.js inclut `npm`.
- Un moyen de servir les pages du site en local, au choix :
  - l'extension **Live Server** de VS Code (clic droit sur `index.html` > « Open with Live Server »), ou
  - la commande `python -m http.server 5500` lancée à la racine du projet.

Le backend n'a **aucune dépendance** : il n'y a rien à installer avec `npm install`.

## Lancer le projet

1. **Démarrer le backend** (dans un premier terminal) :
   ```bash
   cd backend
   npm start
   ```
   Le terminal affiche `Serveur démarré sur http://localhost:3000`. Pour l'arrêter : `Ctrl+C`.
   (`npm run dev` redémarre le serveur automatiquement quand un fichier change.)

2. **Ouvrir le site** avec Live Server (ou `python -m http.server 5500`), puis aller sur `pages/contact.html`.

3. **Tester** : envoyer un message. Il apparaît dans `backend/data/messages.json`.

> Si le backend est éteint, le formulaire de contact affiche « Impossible de joindre le serveur ».
> L'adresse du backend utilisée par le site est dans `assets/js/config.js`.

### Réglages du backend (facultatifs)

Variables d'environnement, avec leur valeur par défaut :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port d'écoute du serveur |
| `CORS_ORIGIN` | `*` | Adresse du site autorisée à appeler l'API (à restreindre en production) |
| `DATA_FILE` | `backend/data/messages.json` | Fichier où sont enregistrés les messages |
| `LOG_REQUESTS` | activé | Mettre `false` pour désactiver les logs |

Exemple : `PORT=4000 npm start` (sur Windows PowerShell : `$env:PORT=4000; npm start`).
Si le port change, mettre à jour `assets/js/config.js`.

## Lancer les tests

```bash
cd backend
npm test
```

25 tests automatiques : validation des données et API de contact (voir [`docs/04-fonctionnalite-contact.md`](docs/04-fonctionnalite-contact.md)).

## API

| Méthode et route | Rôle |
|---|---|
| `POST /api/contact` | Envoyer un message de contact (`nom`, `email`, `message`, `sujet` facultatif) |
| `GET /api/health` | Vérifier que le serveur tourne |

Détail des requêtes, réponses et codes d'erreur : [`docs/04-fonctionnalite-contact.md`](docs/04-fonctionnalite-contact.md).

## Structure du projet

```
index.html                Quiz d'objectif (page d'entrée)
pages/                    accueil, programmes, contact, connexion
assets/
  css/                    common.css (règles partagées) + un CSS par page
  js/                     common.js, validation.js, config.js + un JS par page
  images/  video/         médias optimisés
backend/                  serveur Node.js natif
  src/                    server.js, app.js, config.js, routes/, controllers/, models/, utils/
  database/               schema.sql et seed.sql (base de données)
  tests/                  tests automatiques
  data/                   messages enregistrés (ignorés par Git)
docs/                     documentation et schémas
sitemap.xml, robots.txt   référencement
```

## Documentation

| Document | Contenu |
|---|---|
| [`docs/01-analyse-fonctionnalites-et-donnees.md`](docs/01-analyse-fonctionnalites-et-donnees.md) | Quelles fonctionnalités ont besoin d'un serveur, quelles données |
| [`docs/02-base-de-donnees.md`](docs/02-base-de-donnees.md) | MCD, MLD, dictionnaire de données, script SQL |
| [`docs/03-schema-fonctionnel-backend.md`](docs/03-schema-fonctionnel-backend.md) | Schéma fonctionnel, structure et rôle de chaque dossier du backend |
| [`docs/04-fonctionnalite-contact.md`](docs/04-fonctionnalite-contact.md) | Fonctionnement du formulaire de contact, API, tests |

Les schémas (images et fichiers sources) sont dans [`docs/schemas/`](docs/schemas/).

## Choix techniques du frontend

**Cohérence.** Mêmes liens de navigation (même ordre), même pied de page et même charte noir / or sur toutes les pages. Aucun style inline : tout passe par des classes. Les règles répétées sont dans `common.css`.

**Responsive.** `box-sizing: border-box` global, champs fluides, titres en `clamp()`, grille Bootstrap.

**Accessibilité (RGAA).**
- Contrastes : texte noir sur fond or (≈ 8:1), placeholders éclaircis (critère 3.2).
- Vidéo d'arrière-plan avec bouton pause/lecture, non lancée en mode « mouvement réduit » (critères 4.10, 13.8).
- Chaque champ a un `<label>` visible et un `autocomplete` ; erreurs liées par `aria-describedby` / `aria-invalid` (11.1, 11.10, 11.13).
- Un seul `h1` par page, hiérarchie de titres sans saut (9.1).
- Lien d'évitement, focus visible, `aria-current`, police OpenDyslexic activable, alternative textuelle du graphique (1.1).

**SEO et poids.** Balises sémantiques, title et description uniques, canonical, Open Graph, schema.org. `sitemap.xml` et `robots.txt` ; la page de connexion est en `noindex` et absente du sitemap. Images redimensionnées, `loading="lazy"`. Vidéo en `preload="none"`, lancée seulement sur grand écran.

**JavaScript.**
- `validation.js` : validation par expressions régulières avec messages d'erreur clairs, et envoi des formulaires avec `fetch` sans recharger la page.
- `accueil.js` : calculateur IMC / besoins (formule de Mifflin-St Jeor) avec graphique **Chart.js**, pour éviter de coder à la main un graphique adaptable et accessible.

## Déploiement

- **Frontend** : GitHub Pages (Settings > Pages > Deploy from a branch > `main` / root). Remplacer ensuite `https://www.powerwebsite.fr` par l'URL réelle dans les `canonical`, les balises Open Graph, `sitemap.xml` et `robots.txt`.
- **Backend** : pas encore hébergé. Tant qu'il ne l'est pas, le formulaire de contact du site en ligne ne peut pas envoyer de message. Une fois hébergé, mettre son adresse dans `assets/js/config.js` et restreindre `CORS_ORIGIN` à l'adresse du site.
