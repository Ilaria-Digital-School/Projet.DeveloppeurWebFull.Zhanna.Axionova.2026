// Tests d'intégration : on démarre le vrai serveur sur un port libre et on lui envoie
// de vraies requêtes HTTP, exactement comme le fera le navigateur.
// Les messages sont écrits dans un dossier temporaire, jamais dans data/messages.json.
// Lancer : npm test

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

// Ces variables doivent être définies AVANT de charger le serveur (config.js les lit au chargement).
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'power-test-'));
process.env.DATA_FILE = path.join(dossier, 'messages.json');
process.env.LOG_REQUESTS = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/app');
const ContactModel = require('../src/models/contact.model');

let serveur;
let base;

test.before(async () => {
    serveur = createServer();
    await new Promise((resolve) => serveur.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${serveur.address().port}`;
});

test.after(async () => {
    await new Promise((resolve) => serveur.close(resolve));
    fs.rmSync(dossier, { recursive: true, force: true });
});

const messageValide = {
    nom: 'Jean Dupont',
    email: 'jean@exemple.com',
    sujet: 'programme',
    message: 'Bonjour, je voudrais des infos sur le programme.',
};

function envoyer(corps, entetes = { 'Content-Type': 'application/json' }) {
    return fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: entetes,
        body: typeof corps === 'string' ? corps : JSON.stringify(corps),
    });
}

test('GET /api/health répond 200', async () => {
    const r = await fetch(`${base}/api/health`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { status: 'ok' });
});

test('POST /api/contact valide : 201 et message enregistré', async () => {
    const r = await envoyer(messageValide);
    assert.equal(r.status, 201);
    const corps = await r.json();
    assert.equal(corps.success, true);
    assert.equal(typeof corps.data.id, 'number');

    const stockes = await ContactModel.findAll();
    const trouve = stockes.find((m) => m.id === corps.data.id);
    assert.equal(trouve.nom, 'Jean Dupont');
    assert.equal(trouve.email, 'jean@exemple.com');
    assert.equal(trouve.statut, 'nouveau');
    assert.ok(trouve.created_at);
});

test('POST /api/contact avec champs manquants : 400 et une erreur par champ', async () => {
    const r = await envoyer({});
    assert.equal(r.status, 400);
    const corps = await r.json();
    assert.equal(corps.success, false);
    assert.deepEqual(Object.keys(corps.errors).sort(), ['email', 'message', 'nom']);
});

test('POST /api/contact avec email et message invalides : 400 ciblé', async () => {
    const r = await envoyer({ ...messageValide, email: 'pas-un-email', message: 'court' });
    assert.equal(r.status, 400);
    const corps = await r.json();
    assert.ok(corps.errors.email);
    assert.ok(corps.errors.message);
    assert.equal(corps.errors.nom, undefined);
});

test('une requête invalide n\'enregistre rien', async () => {
    const avant = (await ContactModel.findAll()).length;
    await envoyer({ ...messageValide, email: 'nope' });
    const apres = (await ContactModel.findAll()).length;
    assert.equal(apres, avant);
});

test('sujet inconnu : 400', async () => {
    const r = await envoyer({ ...messageValide, sujet: 'piratage' });
    assert.equal(r.status, 400);
    assert.ok((await r.json()).errors.sujet);
});

test('JSON cassé : 400', async () => {
    const r = await envoyer('{"nom": "Jean"', { 'Content-Type': 'application/json' });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).message, 'JSON invalide.');
});

test('corps JSON qui n\'est pas un objet : 400', async () => {
    for (const corps of ['[1,2,3]', 'null', '"texte"']) {
        const r = await envoyer(corps);
        assert.equal(r.status, 400, corps);
    }
});

test('Content-Type autre que JSON : 415', async () => {
    const r = await envoyer('nom=Jean', { 'Content-Type': 'text/plain' });
    assert.equal(r.status, 415);
});

test('corps trop volumineux : 413', async () => {
    const r = await envoyer({ ...messageValide, message: 'x'.repeat(50 * 1024) });
    assert.equal(r.status, 413);
});

test('route inconnue : 404', async () => {
    const r = await fetch(`${base}/api/nimporte-quoi`);
    assert.equal(r.status, 404);
    assert.equal((await r.json()).success, false);
});

test('mauvaise méthode sur /api/contact : 405 avec l\'en-tête Allow', async () => {
    const r = await fetch(`${base}/api/contact`);
    assert.equal(r.status, 405);
    assert.equal(r.headers.get('allow'), 'POST');
});

test('requête préliminaire CORS (OPTIONS) : 204 avec les en-têtes CORS', async () => {
    const r = await fetch(`${base}/api/contact`, { method: 'OPTIONS' });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.match(r.headers.get('access-control-allow-methods'), /POST/);
    assert.match(r.headers.get('access-control-allow-headers'), /Content-Type/i);
});

test('les réponses d\'erreur contiennent aussi l\'en-tête CORS', async () => {
    const r = await envoyer({});
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
});

test('20 messages envoyés en même temps : tous enregistrés, identifiants uniques', async () => {
    const avant = (await ContactModel.findAll()).length;
    const reponses = await Promise.all(
        Array.from({ length: 20 }, (_, i) => envoyer({ ...messageValide, nom: `Client Numero${String.fromCharCode(65 + i)}` }))
    );
    assert.ok(reponses.every((r) => r.status === 201));

    const stockes = await ContactModel.findAll();
    assert.equal(stockes.length, avant + 20);
    assert.equal(new Set(stockes.map((m) => m.id)).size, stockes.length);
});
