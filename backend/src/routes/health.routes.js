const { verifierEtat } = require('../controllers/health.controller');

module.exports = [
    { method: 'GET', path: '/api/health', handler: verifierEtat },
];
