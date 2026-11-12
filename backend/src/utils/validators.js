// validators.js - règles de validation des données reçues.
//
// IMPORTANT : le navigateur valide déjà le formulaire (assets/js/validation.js),
// mais le serveur ne doit JAMAIS faire confiance au navigateur : n'importe qui peut
// envoyer une requête sans passer par le formulaire. On revérifie donc tout ici,
// avec les mêmes expressions régulières que côté frontend.

const REGEX_NOM = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,49}$/;
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;
const SUJETS = ['programme', 'tarif', 'autre'];

/** Retire les caractères de contrôle invisibles (sauf retour à la ligne et tabulation). */
function nettoyer(texte) {
    return texte
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
}

/**
 * Valide les données du formulaire de contact.
 * @param {object} donnees  corps de la requête (déjà transformé en objet)
 * @returns {{ valide: boolean, erreurs: object, valeurs: object }}
 *   erreurs : un message par champ invalide ; valeurs : données nettoyées, prêtes à être stockées
 */
function validerContact(donnees) {
    const erreurs = {};
    const valeurs = {};

    // --- nom ---
    if (typeof donnees.nom !== 'string' || nettoyer(donnees.nom) === '') {
        erreurs.nom = 'Le nom est obligatoire.';
    } else {
        valeurs.nom = nettoyer(donnees.nom);
        if (!REGEX_NOM.test(valeurs.nom)) {
            erreurs.nom = 'Entre 2 et 50 lettres (espaces, apostrophes et tirets autorisés).';
        }
    }

    // --- email ---
    if (typeof donnees.email !== 'string' || nettoyer(donnees.email) === '') {
        erreurs.email = "L'adresse email est obligatoire.";
    } else {
        valeurs.email = nettoyer(donnees.email).toLowerCase();
        if (valeurs.email.length > EMAIL_MAX || !REGEX_EMAIL.test(valeurs.email)) {
            erreurs.email = 'Adresse email invalide (exemple : nom@exemple.com).';
        }
    }

    // --- message ---
    if (typeof donnees.message !== 'string' || nettoyer(donnees.message) === '') {
        erreurs.message = 'Le message est obligatoire.';
    } else {
        valeurs.message = nettoyer(donnees.message);
        if (valeurs.message.length < MESSAGE_MIN || valeurs.message.length > MESSAGE_MAX) {
            erreurs.message = `Le message doit contenir entre ${MESSAGE_MIN} et ${MESSAGE_MAX} caractères.`;
        }
    }

    // --- sujet (facultatif : "autre" par défaut) ---
    if (donnees.sujet === undefined || donnees.sujet === null || donnees.sujet === '') {
        valeurs.sujet = 'autre';
    } else if (typeof donnees.sujet !== 'string' || !SUJETS.includes(donnees.sujet)) {
        erreurs.sujet = `Sujet invalide (valeurs acceptées : ${SUJETS.join(', ')}).`;
    } else {
        valeurs.sujet = donnees.sujet;
    }

    return { valide: Object.keys(erreurs).length === 0, erreurs, valeurs };
}

module.exports = { validerContact, SUJETS, MESSAGE_MIN, MESSAGE_MAX };
