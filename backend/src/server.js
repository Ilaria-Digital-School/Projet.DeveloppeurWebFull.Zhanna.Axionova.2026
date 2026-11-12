// server.js - point d'entrée : démarre le serveur HTTP.
//   npm start      (ou)      node src/server.js

const config = require('./config');
const { createServer } = require('./app');

const serveur = createServer();

serveur.listen(config.port, () => {
    console.log(`Serveur démarré sur http://localhost:${config.port}`);
    console.log('  POST /api/contact   envoyer un message de contact');
    console.log('  GET  /api/health    vérifier que le serveur tourne');
});

// Arrêt propre avec Ctrl+C
process.on('SIGINT', () => {
    serveur.close(() => process.exit(0));
});
