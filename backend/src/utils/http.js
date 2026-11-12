// http.js - fonctions utilitaires pour répondre et lire les requêtes.

const { HttpError } = require('./errors');
const config = require('../config');

/** Envoie une réponse JSON. */
function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

/**
 * Lit le corps d'une requête et le transforme en objet JavaScript.
 * Refuse : un autre format que du JSON (415), un corps trop gros (413),
 * du JSON invalide ou qui n'est pas un objet (400).
 * @returns {Promise<object>}
 */
function readJsonBody(req, maxBytes = config.maxBodyBytes) {
    return new Promise((resolve, reject) => {
        const type = (req.headers['content-type'] || '').toLowerCase();
        if (!type.startsWith('application/json')) {
            return reject(new HttpError(415, 'Les données doivent être envoyées en JSON (Content-Type: application/json).'));
        }

        // Si le client annonce déjà une taille trop grande, on refuse sans rien lire.
        if (Number(req.headers['content-length']) > maxBytes) {
            return reject(new HttpError(413, 'Message trop volumineux.'));
        }

        const morceaux = [];
        let taille = 0;
        let tropGros = false;

        req.on('data', (morceau) => {
            if (tropGros) return;
            taille += morceau.length;
            if (taille > maxBytes) {
                tropGros = true;
                morceaux.length = 0;
                return reject(new HttpError(413, 'Message trop volumineux.'));
            }
            morceaux.push(morceau);
        });

        req.on('end', () => {
            if (tropGros) return;
            try {
                const donnees = JSON.parse(Buffer.concat(morceaux).toString('utf8'));
                if (donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) {
                    return reject(new HttpError(400, 'Le corps de la requête doit être un objet JSON.'));
                }
                resolve(donnees);
            } catch {
                reject(new HttpError(400, 'JSON invalide.'));
            }
        });

        req.on('error', reject);
    });
}

module.exports = { sendJson, readJsonBody };
