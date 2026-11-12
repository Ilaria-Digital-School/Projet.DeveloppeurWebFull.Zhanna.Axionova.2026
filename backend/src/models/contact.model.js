// contact.model.js - accès aux données des messages de contact.
//
// Pour cette première étape, les messages sont stockés dans un fichier JSON
// (data/messages.json). La structure d'un message est la MÊME que la table
// `messages_contact` du schéma de base de données (voir docs/base-de-donnees.md).
// Quand la vraie base de données sera branchée, seul ce fichier changera :
// le contrôleur continuera d'appeler create() sans rien savoir du stockage.

const fs = require('node:fs/promises');
const path = require('node:path');
const config = require('../config');

// File d'attente : deux messages reçus au même instant sont écrits l'un après
// l'autre, sinon le second écraserait le premier dans le fichier.
let file = Promise.resolve();
function enFile(tache) {
    const execution = file.then(tache);
    file = execution.catch(() => {});
    return execution;
}

async function lireTout() {
    try {
        const contenu = await fs.readFile(config.dataFile, 'utf8');
        return JSON.parse(contenu);
    } catch (erreur) {
        if (erreur.code === 'ENOENT') return []; // fichier pas encore créé : aucun message
        throw erreur; // fichier illisible : on ne l'écrase surtout pas
    }
}

async function ecrireTout(messages) {
    await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
    // On écrit dans un fichier temporaire puis on le renomme : si le serveur
    // s'arrête en pleine écriture, le fichier d'origine reste intact.
    const temporaire = `${config.dataFile}.tmp`;
    await fs.writeFile(temporaire, JSON.stringify(messages, null, 2), 'utf8');
    await fs.rename(temporaire, config.dataFile);
}

/**
 * Enregistre un message de contact.
 * @param {{nom: string, email: string, sujet: string, message: string}} valeurs  données déjà validées
 * @returns {Promise<object>} le message enregistré (avec son id)
 */
function create(valeurs) {
    return enFile(async () => {
        const messages = await lireTout();
        const id = messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
        const enregistrement = {
            id,
            nom: valeurs.nom,
            email: valeurs.email,
            sujet: valeurs.sujet,
            message: valeurs.message,
            statut: 'nouveau',
            utilisateur_id: null, // sera rempli quand les comptes utilisateurs existeront
            created_at: new Date().toISOString(),
        };
        messages.push(enregistrement);
        await ecrireTout(messages);
        return enregistrement;
    });
}

/** Retourne tous les messages (utilisé par les tests ; aucune route ne l'expose). */
function findAll() {
    return enFile(lireTout);
}

module.exports = { create, findAll };
