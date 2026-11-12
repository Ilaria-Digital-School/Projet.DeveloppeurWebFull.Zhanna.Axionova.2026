# 4. Fonctionnalité : formulaire de contact

## Ce que fait la fonctionnalité

Un visiteur remplit le formulaire de `pages/contact.html` (nom, email, sujet, message). Le message est vérifié dans le navigateur, envoyé au serveur Node.js, vérifié une deuxième fois par le serveur, puis enregistré. Le visiteur voit ensuite un message de confirmation, ou des messages d'erreur précis si quelque chose ne va pas.

## L'API

### `POST /api/contact`

Envoie un message de contact.

**Requête** (`Content-Type: application/json`) :

```json
{
  "nom": "Jean Dupont",
  "email": "jean@exemple.com",
  "sujet": "tarif",
  "message": "Bonjour, quels sont vos tarifs ?"
}
```

**Réponse en cas de succès** (`201 Created`) :

```json
{
  "success": true,
  "message": "Merci ! Ton message a bien été envoyé, un coach te répond rapidement.",
  "data": { "id": 1 }
}
```

**Réponse quand des champs sont invalides** (`400 Bad Request`) :

```json
{
  "success": false,
  "message": "Certains champs sont invalides.",
  "errors": {
    "email": "Adresse email invalide (exemple : nom@exemple.com).",
    "message": "Le message doit contenir entre 10 et 1000 caractères."
  }
}
```

### Codes de réponse

| Code | Situation |
|---|---|
| `201` | Message enregistré |
| `400` | Un ou plusieurs champs invalides, JSON cassé, ou corps qui n'est pas un objet JSON |
| `404` | Route inconnue |
| `405` | Mauvaise méthode (par exemple `GET /api/contact`) : l'en-tête `Allow: POST` l'indique |
| `413` | Corps de requête trop gros (plus de 10 Ko) |
| `415` | Les données ne sont pas envoyées en JSON |
| `500` | Erreur inattendue du serveur (aucun détail technique n'est révélé) |

### `GET /api/health`

Répond `{"status":"ok"}`. Sert à vérifier que le serveur tourne.

## Règles de validation

Le serveur applique **les mêmes expressions régulières que le navigateur** (voir `assets/js/validation.js`). Il revérifie tout car n'importe qui peut envoyer une requête sans passer par le formulaire : le serveur ne doit jamais faire confiance au navigateur.

| Champ | Obligatoire | Règle |
|---|---|---|
| `nom` | oui | 2 à 50 caractères : lettres (accents inclus), espaces, apostrophes, tirets ; commence par une lettre |
| `email` | oui | Forme `texte@domaine.extension`, 254 caractères maximum ; enregistré en minuscules |
| `message` | oui | 10 à 1000 caractères |
| `sujet` | non | `programme`, `tarif` ou `autre` ; vaut `autre` s'il est absent |

Avant validation, chaque texte est **nettoyé** : espaces au début et à la fin retirés, caractères de contrôle invisibles supprimés. Un champ qui n'est pas du texte (nombre, liste…) est refusé.

## Intégration côté frontend

| Fichier | Rôle |
|---|---|
| `pages/contact.html` | Le formulaire ; charge `config.js` avant `validation.js` |
| `assets/js/config.js` | Adresse du backend (`http://localhost:3000`). À changer quand le backend sera hébergé |
| `assets/js/contact.js` | Pré-remplit le sujet depuis l'URL et branche le formulaire sur `POST /api/contact` |
| `assets/js/validation.js` | Valide par regex, envoie avec `fetch`, lit la réponse et affiche succès ou erreurs |
| `assets/css/common.css` | Style des messages d'erreur |

### Ce que voit le visiteur

| Situation | Affichage |
|---|---|
| Un champ ne respecte pas les règles | Message rouge sous le champ, **sans aucune requête** envoyée |
| Tout est valide, le serveur répond 201 | Message vert de confirmation, formulaire vidé, page non rechargée |
| Le serveur répond 400 avec des erreurs par champ | Le message du serveur s'affiche sous chaque champ concerné, et le curseur va sur le premier |
| Le serveur répond 5xx | « Le serveur a rencontré un problème, merci de réessayer plus tard. » |
| Le serveur est éteint ou injoignable | « Impossible de joindre le serveur. Vérifie ta connexion ou réessaie dans un instant. » |
| Pendant l'envoi | « Envoi en cours… » et le bouton est désactivé pour éviter les doubles envois |

### Détail technique à connaître : le CORS

Le site (par exemple sur le port 5500) et l'API (port 3000) sont à des adresses différentes. Par sécurité, un navigateur refuse qu'une page appelle une autre adresse, sauf si cette dernière l'autorise avec des en-têtes `Access-Control-Allow-*`. Pour un envoi en JSON, le navigateur commence même par envoyer une requête préliminaire `OPTIONS`. `app.js` ajoute ces en-têtes à toutes les réponses et répond `204` à `OPTIONS`.
Par défaut, toutes les origines sont autorisées (pratique en développement). En production, on la restreint avec la variable `CORS_ORIGIN` (par exemple `https://monsite.fr`).

## Stockage des messages

Les messages sont enregistrés dans `backend/data/messages.json`. Chaque message a exactement les champs de la table `messages_contact` du schéma de base de données :

```json
{
  "id": 1,
  "nom": "Jean Dupont",
  "email": "jean@exemple.com",
  "sujet": "tarif",
  "message": "Bonjour, quels sont vos tarifs ?",
  "statut": "nouveau",
  "utilisateur_id": null,
  "created_at": "2026-11-12T10:59:33.697Z"
}
```

Deux précautions évitent de perdre des messages : les écritures sont **mises en file d'attente** (deux messages reçus en même temps ne s'écrasent pas), et le fichier est écrit **via un fichier temporaire** puis renommé (une coupure en pleine écriture ne corrompt pas le fichier existant).
Aucune route ne permet de lire les messages : elle exposerait des données personnelles à n'importe qui. La lecture viendra avec la connexion et le rôle `admin`.

## Sécurité et robustesse

- Validation refaite côté serveur avec les mêmes règles que le navigateur.
- Corps de requête limité à 10 Ko ; requêtes coupées après 10 secondes.
- Format JSON obligatoire (415 sinon).
- Les erreurs inattendues ne renvoient jamais de détail technique au client (elles sont seulement journalisées dans la console du serveur).
- En-têtes `X-Content-Type-Options: nosniff` et `Cache-Control: no-store`.

## Tests

### Tests automatiques (25)

```bash
cd backend
npm test
```

Ils utilisent le module de test intégré à Node (`node:test`), sans aucune bibliothèque.

| Fichier | Tests | Ce qui est vérifié |
|---|---|---|
| `tests/validators.test.js` | 10 | Données valides acceptées ; nettoyage ; noms avec accents ; refus d'un nom, d'un email ou d'un message invalide ; valeurs qui ne sont pas du texte ; tous les champs manquants signalés ensemble ; sujet |
| `tests/contact.api.test.js` | 15 | Un vrai serveur démarre sur un port libre et reçoit de vraies requêtes : `health` ; 201 et message enregistré ; 400 (champs manquants, email et message invalides, sujet inconnu, JSON cassé, corps qui n'est pas un objet) ; rien n'est enregistré quand la requête est invalide ; 415 ; 413 ; 404 ; 405 avec `Allow` ; requête `OPTIONS` (CORS) ; en-têtes CORS aussi sur les erreurs ; 20 envois simultanés, tous enregistrés avec des identifiants différents |

Les tests écrivent dans un dossier temporaire : ils ne touchent jamais à `data/messages.json`.

### Test manuel de bout en bout (à faire et à montrer)

1. Lancer le backend (`cd backend && npm start`) et ouvrir `pages/contact.html` avec Live Server.
2. Cliquer sur **ENVOYER** avec le formulaire vide : trois messages d'erreur, aucune requête (onglet Réseau des outils de développement, F12).
3. Remplir correctement et envoyer : message vert, formulaire vidé. Vérifier que `backend/data/messages.json` contient le message.
4. Avec `curl`, tester une requête invalide :
   ```bash
   curl -i -X POST http://localhost:3000/api/contact \
     -H "Content-Type: application/json" \
     -d '{"nom":"J","email":"nope","message":"court"}'
   ```
   Réponse attendue : `400` avec les trois erreurs.
5. Arrêter le backend (Ctrl+C), renvoyer le formulaire : « Impossible de joindre le serveur ».

## Limites actuelles et suites

- **Stockage provisoire** : fichier JSON en attendant la vraie base de données (schéma prêt dans `backend/database/`).
- **Backend non hébergé** : sur le site en ligne (GitHub Pages), le formulaire affichera « Impossible de joindre le serveur » tant que le backend n'est pas hébergé et que `config.js` ne pointe pas vers son adresse.
- **Pas de limitation du nombre d'envois** : on pourrait ajouter une limite par adresse IP pour éviter le spam.
- **Pas de consultation des messages** : prévue avec l'authentification.
