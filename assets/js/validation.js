// validation.js
// Validation côté client par expressions régulières + envoi asynchrone (fetch).
// Chargé sur toutes les pages qui contiennent un formulaire.
//
// Utilisation : ajouter data-regle="nom|email|motdepasse|message|poids|taille|age"
// sur un champ ; le message d'erreur s'affiche juste en dessous (aria-describedby).

var PW = (function () {
    'use strict';

    // Point d'envoi des formulaires. JSONPlaceholder simule une API : il répond
    // 201 sans rien enregistrer. À remplacer par une vraie URL (Formspree, API...).
    var ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

    var REGLES = {
        nom: {
            regex: /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,49}$/,
            message: 'Entre 2 et 50 lettres (espaces, apostrophes et tirets autorisés).'
        },
        email: {
            regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
            message: 'Adresse email invalide (exemple : nom@exemple.com).'
        },
        motdepasse: {
            regex: /^.{8,64}$/,
            message: 'Le mot de passe doit contenir au moins 8 caractères.'
        },
        message: {
            regex: /^[\s\S]{10,1000}$/,
            message: 'Le message doit contenir entre 10 et 1000 caractères.'
        },
        poids: {
            regex: /^\d{2,3}([.,]\d)?$/,
            message: 'Indique ton poids en kg (exemple : 72 ou 72,5).'
        },
        taille: {
            regex: /^\d{3}$/,
            message: 'Indique ta taille en cm sur 3 chiffres (exemple : 175).'
        },
        age: {
            regex: /^\d{2}$/,
            message: 'Indique ton âge sur 2 chiffres (exemple : 25).'
        }
    };

    function zoneErreur(champ) {
        var id = champ.id + '-erreur';
        var zone = document.getElementById(id);
        if (!zone) {
            zone = document.createElement('span');
            zone.id = id;
            zone.className = 'champ-erreur';
            champ.insertAdjacentElement('afterend', zone);
            champ.setAttribute('aria-describedby', id);
        }
        return zone;
    }

    function afficherErreur(champ, message) {
        zoneErreur(champ).textContent = message;
        if (message) {
            champ.setAttribute('aria-invalid', 'true');
        } else {
            champ.removeAttribute('aria-invalid');
        }
    }

    /** Valide un champ. Retourne true s'il est valide. */
    function validerChamp(champ) {
        var regle = REGLES[champ.dataset.regle];
        var valeur = champ.dataset.regle === 'motdepasse' ? champ.value : champ.value.trim();
        var message = '';

        if (champ.required && valeur === '') {
            message = 'Ce champ est obligatoire.';
        } else if (valeur !== '' && regle && !regle.regex.test(valeur)) {
            message = regle.message;
        } else if (valeur !== '' && (champ.dataset.min || champ.dataset.max)) {
            var nombre = parseFloat(valeur.replace(',', '.'));
            var min = parseFloat(champ.dataset.min);
            var max = parseFloat(champ.dataset.max);
            if (nombre < min || nombre > max) {
                message = 'La valeur doit être comprise entre ' + min + ' et ' + max + '.';
            }
        }

        afficherErreur(champ, message);
        return message === '';
    }

    function champsAValider(form) {
        return form.querySelectorAll('[data-regle], [required]');
    }

    /** Valide tout le formulaire et met le focus sur le premier champ en erreur. */
    function validerFormulaire(form) {
        var premierInvalide = null;
        Array.prototype.forEach.call(champsAValider(form), function (champ) {
            if (!validerChamp(champ) && !premierInvalide) {
                premierInvalide = champ;
            }
        });
        if (premierInvalide) {
            premierInvalide.focus();
        }
        return premierInvalide === null;
    }

    /** Validation au fil de la saisie : à la sortie du champ, puis à chaque frappe. */
    function validationEnDirect(form) {
        Array.prototype.forEach.call(champsAValider(form), function (champ) {
            // On crée la zone d'erreur dès le départ (vide) : si elle apparaissait
            // seulement au moment de l'erreur, le bouton « Envoyer » se décalerait
            // pendant le clic et le clic raterait le bouton.
            zoneErreur(champ);
            champ.addEventListener('blur', function () { validerChamp(champ); });
            champ.addEventListener('input', function () {
                if (champ.getAttribute('aria-invalid') === 'true') {
                    validerChamp(champ);
                }
            });
        });
    }

    function zoneStatut(form) {
        var zone = form.querySelector('.statut-formulaire');
        if (!zone) {
            zone = document.createElement('div');
            zone.className = 'statut-formulaire';
            zone.setAttribute('role', 'status');
            form.appendChild(zone);
        }
        return zone;
    }

    /**
     * Affiche une erreur renvoyée par le serveur.
     * Si le serveur détaille les champs fautifs (ex. { email: "..." }), le message
     * s'affiche sous chaque champ ; sinon, un message général s'affiche en bas du formulaire.
     */
    function afficherErreursServeur(form, statut, corps, codeHttp) {
        statut.className = 'statut-formulaire erreur';

        if (corps && corps.errors) {
            var premier = null;
            Object.keys(corps.errors).forEach(function (nom) {
                var champ = form.elements[nom];
                if (champ && champ.id) {
                    afficherErreur(champ, corps.errors[nom]);
                    if (!premier) { premier = champ; }
                }
            });
            if (premier) { premier.focus(); }
            statut.textContent = 'Merci de corriger les champs signalés.';
        } else if (codeHttp >= 500) {
            // On n'affiche jamais le détail d'une erreur serveur à l'utilisateur.
            statut.textContent = 'Le serveur a rencontré un problème, merci de réessayer plus tard.';
        } else {
            statut.textContent = (corps && corps.message) ||
                'Une erreur est survenue, merci de réessayer dans un instant.';
        }
    }

    /**
     * Envoi asynchrone (fetch) : la page ne se recharge pas.
     * options.url    : adresse où envoyer les données (par défaut : l'API de démonstration)
     * options.succes : message affiché si le serveur ne fournit pas le sien
     */
    function envoyer(form, options) {
        var statut = zoneStatut(form);
        var bouton = form.querySelector('[type="submit"]');
        var donnees = {};

        // On n'envoie jamais un mot de passe à l'API de démonstration.
        Array.prototype.forEach.call(form.elements, function (el) {
            if (el.name && el.type !== 'password' && el.type !== 'submit') {
                donnees[el.name] = el.value;
            }
        });

        statut.className = 'statut-formulaire';
        statut.textContent = 'Envoi en cours\u2026';
        if (bouton) { bouton.disabled = true; }

        return fetch(options.url || ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donnees)
        })
            .then(function (reponse) {
                // On lit la réponse JSON du serveur (succès comme erreur).
                return reponse.json().then(
                    function (corps) { return { ok: reponse.ok, status: reponse.status, corps: corps }; },
                    function () { return { ok: reponse.ok, status: reponse.status, corps: null }; }
                );
            })
            .then(function (resultat) {
                if (resultat.ok) {
                    statut.className = 'statut-formulaire succes';
                    statut.textContent = (resultat.corps && resultat.corps.message) || options.succes;
                    form.reset();
                } else {
                    afficherErreursServeur(form, statut, resultat.corps, resultat.status);
                }
            })
            .catch(function () {
                // fetch échoue (et n'a donc aucune réponse) quand le serveur est éteint ou injoignable.
                statut.className = 'statut-formulaire erreur';
                statut.textContent = 'Impossible de joindre le serveur. Vérifie ta connexion ou réessaie dans un instant.';
            })
            .then(function () {
                if (bouton) { bouton.disabled = false; }
            });
    }

    /**
     * Branche un formulaire : validation regex + envoi asynchrone.
     * @param {HTMLFormElement} form
     * @param {{succes: string, url?: string}} options
     */
    function initFormulaire(form, options) {
        if (!form) { return; }
        form.noValidate = true; // on remplace les bulles natives par nos messages
        validationEnDirect(form);
        form.addEventListener('submit', function (evenement) {
            evenement.preventDefault();
            if (validerFormulaire(form)) {
                envoyer(form, options);
            }
        });
    }

    return {
        validerChamp: validerChamp,
        validerFormulaire: validerFormulaire,
        validationEnDirect: validationEnDirect,
        initFormulaire: initFormulaire
    };
})();
