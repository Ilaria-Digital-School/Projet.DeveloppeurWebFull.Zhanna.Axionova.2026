// contact.routes.js - routes de la fonctionnalité « contact ».
// Une route = une méthode HTTP + un chemin + la fonction (contrôleur) qui le traite.

const { creerMessage } = require('../controllers/contact.controller');

module.exports = [
    { method: 'POST', path: '/api/contact', handler: creerMessage },
];
