-- Données initiales : ce qui est aujourd'hui écrit « en dur » dans le HTML du site.

INSERT INTO objectifs (code, libelle) VALUES
    ('perte_de_poids',          'Perte de poids'),
    ('renforcement_musculaire', 'Musculation'),
    ('nutrition',               'Nutrition & Santé');

INSERT INTO formules (nom, prix_mensuel, description, est_populaire) VALUES
    ('Découverte', 0.00,  'Bilan personnalisé et accès au quiz santé', FALSE),
    ('Basic',      9.90,  'Accès illimité aux vidéos, suivi de progression, 1 ebook offert', TRUE),
    ('Premium',    19.90, 'Tout le contenu Basic, coaching nutritionnel, support 24h/7j', FALSE);

INSERT INTO programmes (slug, titre, description, image, objectif_id) VALUES
    ('prise-de-masse', 'Prise de masse',
     'Un programme intensif de 12 semaines pour maximiser votre volume musculaire.',
     'volume.jpg', (SELECT id FROM objectifs WHERE code = 'renforcement_musculaire')),
    ('nutrition-pro', 'Nutrition Pro',
     'Plans alimentaires personnalisés pour accompagner vos efforts physiques.',
     'nutrition.jpg', (SELECT id FROM objectifs WHERE code = 'nutrition')),
    ('seche-cardio', 'Sèche / Cardio',
     'Brûlez les graisses tout en conservant votre énergie et votre muscle.',
     'cardio.jpg', (SELECT id FROM objectifs WHERE code = 'perte_de_poids'));
