// contact.controller.js - logique de la fonctionnalité « formulaire de contact ».
// Le contrôleur orchestre : il lit la requête, valide, appelle le modèle, répond.

const { readJsonBody, sendJson } = require('../utils/http');
const { validerContact } = require('../utils/validators');
const { HttpError } = require('../utils/errors');
const ContactModel = require('../models/contact.model');

/** POST /api/contact */
async function creerMessage(req, res) {
    const donnees = await readJsonBody(req);

    const { valide, erreurs, valeurs } = validerContact(donnees);
    if (!valide) {
        throw new HttpError(400, 'Certains champs sont invalides.', erreurs);
    }

    const message = await ContactModel.create(valeurs);

    sendJson(res, 201, {
        success: true,
        message: 'Merci ! Ton message a bien été envoyé, un coach te répond rapidement.',
        data: { id: message.id },
    });
}

module.exports = { creerMessage };
