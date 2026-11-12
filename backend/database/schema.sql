-- ============================================================
-- Power Website - schéma de la base de données (traduction du MLD)
-- Écrit en SQL pour PostgreSQL. Pour MySQL/MariaDB :
--   remplacer "INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY" par "INTEGER AUTO_INCREMENT PRIMARY KEY"
-- Voir docs/02-base-de-donnees.md pour le détail des tables.
-- ============================================================

-- Objectifs choisis dans le quiz (perte de poids, musculation, nutrition)
CREATE TABLE objectifs (
    id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code    VARCHAR(50)  NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL
);

-- Comptes des visiteurs inscrits (inscription du quiz + page de connexion)
CREATE TABLE utilisateurs (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prenom            VARCHAR(50)  NOT NULL,
    email             VARCHAR(254) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,            -- jamais le mot de passe en clair
    role              VARCHAR(20)  NOT NULL DEFAULT 'client'
                      CHECK (role IN ('client', 'admin')),
    objectif_id       INTEGER REFERENCES objectifs(id) ON DELETE SET NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Programmes affichés sur les pages Accueil et Programmes
CREATE TABLE programmes (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug        VARCHAR(80)  NOT NULL UNIQUE,           -- ex. prise-de-masse (sert d'ancre dans l'URL)
    titre       VARCHAR(120) NOT NULL,
    description TEXT         NOT NULL,
    image       VARCHAR(255) NOT NULL,
    objectif_id INTEGER      NOT NULL REFERENCES objectifs(id)
);

-- Abonnements proposés : Découverte, Basic, Premium
CREATE TABLE formules (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom           VARCHAR(50)  NOT NULL UNIQUE,
    prix_mensuel  DECIMAL(6,2) NOT NULL CHECK (prix_mensuel >= 0),
    description   TEXT,
    est_populaire BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Qui a souscrit quelle formule, et quand (association SOUSCRIRE du MCD)
CREATE TABLE souscriptions (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id INTEGER     NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    formule_id     INTEGER     NOT NULL REFERENCES formules(id),
    date_debut     DATE        NOT NULL,
    date_fin       DATE,
    statut         VARCHAR(20) NOT NULL DEFAULT 'active'
                   CHECK (statut IN ('active', 'terminee', 'annulee')),
    CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Messages reçus par le formulaire de contact  <-- PREMIÈRE FONCTIONNALITÉ DÉVELOPPÉE
-- Même structure que les objets enregistrés par backend/src/models/contact.model.js
CREATE TABLE messages_contact (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom            VARCHAR(50)   NOT NULL,
    email          VARCHAR(254)  NOT NULL,
    sujet          VARCHAR(20)   NOT NULL DEFAULT 'autre'
                   CHECK (sujet IN ('programme', 'tarif', 'autre')),
    message        VARCHAR(1000) NOT NULL,
    statut         VARCHAR(20)   NOT NULL DEFAULT 'nouveau'
                   CHECK (statut IN ('nouveau', 'lu', 'traite')),
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,  -- vide si le visiteur n'est pas connecté
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Résultats du calculateur IMC / besoins de la page Accueil (sauvegarde facultative)
CREATE TABLE bilans (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id  INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
    poids_kg        DECIMAL(4,1) NOT NULL CHECK (poids_kg BETWEEN 30 AND 250),
    taille_cm       INTEGER      NOT NULL CHECK (taille_cm BETWEEN 120 AND 230),
    age             INTEGER      NOT NULL CHECK (age BETWEEN 15 AND 99),
    sexe            VARCHAR(10)  NOT NULL CHECK (sexe IN ('femme', 'homme')),
    objectif_calcul VARCHAR(10)  NOT NULL CHECK (objectif_calcul IN ('perte', 'masse', 'forme')),
    imc             DECIMAL(4,1) NOT NULL,
    kcal            INTEGER      NOT NULL,
    proteines_g     INTEGER      NOT NULL,
    glucides_g      INTEGER      NOT NULL,
    lipides_g       INTEGER      NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index : accélèrent les recherches les plus fréquentes
CREATE INDEX idx_messages_contact_statut  ON messages_contact (statut);
CREATE INDEX idx_souscriptions_utilisateur ON souscriptions (utilisateur_id);
CREATE INDEX idx_programmes_objectif       ON programmes (objectif_id);
