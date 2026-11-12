// health.controller.js - route de contrôle : permet de vérifier que le serveur tourne.

const { sendJson } = require('../utils/http');

/** GET /api/health */
function verifierEtat(req, res) {
    sendJson(res, 200, { status: 'ok' });
}

module.exports = { verifierEtat };
