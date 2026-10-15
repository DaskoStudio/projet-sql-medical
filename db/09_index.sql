-- ═══════════════════════════════════════════════════════════
-- PSG MEDICAL HUB — Index pour optimisation des requêtes
-- (mesures avant/après dans analyse/benchmark_index.sql)
-- ═══════════════════════════════════════════════════════════

-- Index 1 : Le planning trié par date (page d'accueil du site)
CREATE INDEX consultations_date_idx ON consultations (date_heure);

-- Index 2 : L'agenda d'un médecin sur une période (stats, calculer_rdv_mois)
CREATE INDEX consultations_medecin_date_idx ON consultations (medecin_id, date_heure);
