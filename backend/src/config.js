// config.js - réglages du serveur, lus depuis les variables d'environnement.
// Chaque valeur a une valeur par défaut : le projet démarre sans configuration.
//
//   PORT          port d'écoute                        (défaut : 3000)
//   CORS_ORIGIN   origine autorisée à appeler l'API    (défaut : * = toutes, pratique en développement)
//   DATA_FILE     fichier où sont stockés les messages (défaut : backend/data/messages.json)
//   LOG_REQUESTS  "false" pour désactiver les logs     (défaut : activés)

const path = require('node:path');

module.exports = {
    port: Number(process.env.PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    dataFile: process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'messages.json'),
    // Taille maximale d'un corps de requête : un message de contact n'a pas besoin de plus.
    maxBodyBytes: 10 * 1024,
    logRequests: process.env.LOG_REQUESTS !== 'false',
};
