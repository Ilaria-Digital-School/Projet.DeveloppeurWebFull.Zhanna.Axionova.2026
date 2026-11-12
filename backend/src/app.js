// app.js - cœur du serveur : reçoit chaque requête, trouve la route, gère les erreurs.
// Chemin d'une requête : app.js -> routes -> contrôleur -> (validation + modèle) -> réponse JSON.

const http = require('node:http');
const config = require('./config');
const { trouverRoute } = require('./routes');
const { sendJson } = require('./utils/http');
const { HttpError } = require('./utils/errors');

/** En-têtes ajoutés à TOUTES les réponses (succès comme erreurs). */
function ajouterEntetes(res) {
    // CORS : autorise le navigateur à laisser le site appeler l'API depuis une autre adresse
    // (ex. site sur le port 5500, API sur le port 3000).
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    if (config.corsOrigin !== '*') res.setHeader('Vary', 'Origin');
    // Sécurité : le navigateur ne doit pas deviner le type du contenu, ni mettre l'API en cache.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
}

/** Transforme une erreur en réponse JSON. Les erreurs inattendues ne révèlent aucun détail. */
function repondreErreur(req, res, erreur) {
    req.resume(); // vide le corps de requête non lu, pour libérer la connexion
    if (res.headersSent) return res.end();

    if (erreur instanceof HttpError) {
        const corps = { success: false, message: erreur.message };
        if (erreur.errors) corps.errors = erreur.errors;
        return sendJson(res, erreur.status, corps);
    }

    console.error('Erreur inattendue :', erreur);
    sendJson(res, 500, { success: false, message: 'Erreur interne du serveur.' });
}

async function traiterRequete(req, res) {
    const debut = Date.now();
    if (config.logRequests) {
        res.on('finish', () => {
            console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - debut} ms)`);
        });
    }

    ajouterEntetes(res);

    try {
        // Requête "préliminaire" envoyée automatiquement par le navigateur avant un POST
        // venant d'une autre origine (CORS) : on répond simplement OK.
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        const { pathname } = new URL(req.url, 'http://localhost');
        const resultat = trouverRoute(req.method, pathname);

        if (resultat.status === 404) throw new HttpError(404, 'Route introuvable.');
        if (resultat.status === 405) {
            res.setHeader('Allow', resultat.allow);
            throw new HttpError(405, 'Méthode non autorisée.');
        }

        await resultat.route.handler(req, res);
    } catch (erreur) {
        repondreErreur(req, res, erreur);
    }
}

/** Crée le serveur HTTP (sans le démarrer : utile pour les tests). */
function createServer() {
    const serveur = http.createServer(traiterRequete);
    serveur.requestTimeout = 10000; // une requête qui traîne plus de 10 s est coupée
    return serveur;
}

module.exports = { createServer };
