// contact.js - formulaire de contact
//
// 1) Pré-remplit le sujet quand on arrive depuis un bouton "DÉCOUVRIR"
//    (contact.html?sujet=programme).
// 2) Valide le formulaire (regex) puis l'envoie au backend : POST /api/contact
//    (fetch, sans recharger la page). Les erreurs du serveur sont affichées par validation.js.

document.addEventListener('DOMContentLoaded', function () {
    var parametres = new URLSearchParams(window.location.search);
    var sujet = parametres.get('sujet');
    var champSujet = document.getElementById('champ-sujet');

    if (sujet && champSujet) {
        var optionExiste = Array.prototype.some.call(
            champSujet.options,
            function (option) { return option.value === sujet; }
        );
        if (optionExiste) {
            champSujet.value = sujet;
        }
    }

    var urlApi = ((window.PW_CONFIG && window.PW_CONFIG.API_URL) || '') + '/api/contact';

    PW.initFormulaire(document.getElementById('formulaire-contact'), {
        url: urlApi,
        succes: 'Merci ! Ton message a bien été envoyé, un coach te répond rapidement.'
    });
});
