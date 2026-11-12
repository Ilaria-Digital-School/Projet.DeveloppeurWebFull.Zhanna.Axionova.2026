// Tests unitaires : règles de validation du formulaire de contact.
// Lancer : npm test

const test = require('node:test');
const assert = require('node:assert/strict');
const { validerContact } = require('../src/utils/validators');

const valide = {
    nom: 'Jean Dupont',
    email: 'jean@exemple.com',
    sujet: 'tarif',
    message: 'Bonjour, quels sont vos tarifs ?',
};

test('accepte des données correctes', () => {
    const r = validerContact(valide);
    assert.equal(r.valide, true);
    assert.deepEqual(r.erreurs, {});
});

test('nettoie les données : espaces retirés, email en minuscules', () => {
    const r = validerContact({ ...valide, nom: '  Jean Dupont  ', email: '  JEAN@Exemple.COM ' });
    assert.equal(r.valeurs.nom, 'Jean Dupont');
    assert.equal(r.valeurs.email, 'jean@exemple.com');
});

test('accepte les noms avec accents, apostrophes et tirets', () => {
    for (const nom of ["Marie-Hélène", "Jean d'Arc", 'Éloïse']) {
        assert.equal(validerContact({ ...valide, nom }).valide, true, nom);
    }
});

test('refuse un nom vide, trop court ou avec des chiffres', () => {
    for (const nom of ['', '   ', 'J', 'Jean123', '<script>']) {
        assert.ok(validerContact({ ...valide, nom }).erreurs.nom, `"${nom}" aurait dû être refusé`);
    }
});

test('refuse les emails invalides', () => {
    for (const email of ['', 'abc', 'a@b', '@exemple.com', 'jean@exemple', 'jean exemple@x.fr']) {
        assert.ok(validerContact({ ...valide, email }).erreurs.email, `"${email}" aurait dû être refusé`);
    }
});

test('refuse un message trop court ou trop long', () => {
    assert.ok(validerContact({ ...valide, message: 'court' }).erreurs.message);
    assert.ok(validerContact({ ...valide, message: 'x'.repeat(1001) }).erreurs.message);
    assert.equal(validerContact({ ...valide, message: 'x'.repeat(1000) }).valide, true);
    assert.equal(validerContact({ ...valide, message: 'x'.repeat(10) }).valide, true);
});

test('refuse les valeurs qui ne sont pas du texte', () => {
    const r = validerContact({ nom: 123, email: { a: 1 }, message: ['abc'] });
    assert.ok(r.erreurs.nom && r.erreurs.email && r.erreurs.message);
});

test('signale tous les champs manquants en une seule fois', () => {
    const r = validerContact({});
    assert.deepEqual(Object.keys(r.erreurs).sort(), ['email', 'message', 'nom']);
});

test('le sujet est facultatif ("autre" par défaut) mais doit être connu', () => {
    const { sujet, ...sansSujet } = valide;
    assert.equal(validerContact(sansSujet).valeurs.sujet, 'autre');
    assert.ok(validerContact({ ...valide, sujet: 'piratage' }).erreurs.sujet);
});

test('retire les caractères de contrôle cachés du message', () => {
    const r = validerContact({ ...valide, message: 'Bonjour\u0000 tout\u0007 le monde' });
    assert.equal(r.valeurs.message, 'Bonjour tout le monde');
});
