// routes/index.js - regroupe toutes les routes et retrouve celle qui correspond à une requête.
// Pour ajouter une fonctionnalité : créer xxx.routes.js, puis l'ajouter à la liste ci-dessous.

const routes = [
    ...require('./contact.routes'),
    ...require('./health.routes'),
];

/**
 * Cherche la route correspondant à la méthode et au chemin.
 * @returns {{route: object}|{status: 404}|{status: 405, allow: string}}
 */
function trouverRoute(method, pathname) {
    // "/api/contact/" est traité comme "/api/contact"
    const chemin = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

    const memeChemin = routes.filter((r) => r.path === chemin);
    if (memeChemin.length === 0) return { status: 404 };

    const route = memeChemin.find((r) => r.method === method);
    if (!route) return { status: 405, allow: memeChemin.map((r) => r.method).join(', ') };

    return { route };
}

module.exports = { trouverRoute };
