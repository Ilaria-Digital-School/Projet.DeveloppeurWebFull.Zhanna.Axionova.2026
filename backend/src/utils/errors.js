// errors.js - erreur "métier" qui porte un code HTTP.
// Les contrôleurs la lancent (throw) ; app.js l'attrape et la transforme en réponse JSON.

class HttpError extends Error {
    /**
     * @param {number} status   code HTTP (400, 404, 413...)
     * @param {string} message  message lisible, renvoyé au client
     * @param {object} [errors] erreurs par champ, ex. { email: "Adresse email invalide." }
     */
    constructor(status, message, errors) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.errors = errors;
    }
}

module.exports = { HttpError };
