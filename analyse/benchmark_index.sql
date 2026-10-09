-- mesure de chaque requête avant et après son index.
-- Ce sont les requêtes du site (backend/index.js).
-- Chaque mesure est lancée deux fois : on garde la seconde.

DROP INDEX IF EXISTS consultations_date_idx;
DROP INDEX IF EXISTS consultations_medecin_date_idx;

\echo '--- Index 1, AVANT : page d accueil, les 100 prochains rendez-vous'
EXPLAIN ANALYZE SELECT c.id, c.date_heure, c.statut, m.nom, p.prenom, p.nom
FROM consultations c
JOIN medecins m ON c.medecin_id = m.id
JOIN patients p ON c.patient_id = p.id
ORDER BY c.date_heure LIMIT 100;
EXPLAIN ANALYZE SELECT c.id, c.date_heure, c.statut, m.nom, p.prenom, p.nom
FROM consultations c
JOIN medecins m ON c.medecin_id = m.id
JOIN patients p ON c.patient_id = p.id
ORDER BY c.date_heure LIMIT 100;

CREATE INDEX consultations_date_idx ON consultations (date_heure);

\echo '--- Index 1, APRÈS'
EXPLAIN ANALYZE SELECT c.id, c.date_heure, c.statut, m.nom, p.prenom, p.nom
FROM consultations c
JOIN medecins m ON c.medecin_id = m.id
JOIN patients p ON c.patient_id = p.id
ORDER BY c.date_heure LIMIT 100;
EXPLAIN ANALYZE SELECT c.id, c.date_heure, c.statut, m.nom, p.prenom, p.nom
FROM consultations c
JOIN medecins m ON c.medecin_id = m.id
JOIN patients p ON c.patient_id = p.id
ORDER BY c.date_heure LIMIT 100;

-- On retire l'index 1 pour mesurer l'index 2 seul.
DROP INDEX consultations_date_idx;

\echo '--- Index 2, AVANT : page statistiques, calculer_rdv_mois pour les 200 médecins'
EXPLAIN ANALYZE SELECT id, nom, calculer_rdv_mois(id, '2026-11-01') AS rdv
FROM medecins ORDER BY rdv DESC LIMIT 10;
EXPLAIN ANALYZE SELECT id, nom, calculer_rdv_mois(id, '2026-11-01') AS rdv
FROM medecins ORDER BY rdv DESC LIMIT 10;

\echo '--- Index 2, AVANT : le calcul pour un seul médecin '
EXPLAIN ANALYZE SELECT count(*) FROM consultations
WHERE medecin_id = 42 AND date_heure >= '2026-11-01' AND date_heure < '2026-12-01';

CREATE INDEX consultations_medecin_date_idx ON consultations (medecin_id, date_heure);

\echo '--- Index 2, APRÈS'
EXPLAIN ANALYZE SELECT id, nom, calculer_rdv_mois(id, '2026-11-01') AS rdv
FROM medecins ORDER BY rdv DESC LIMIT 10;
EXPLAIN ANALYZE SELECT id, nom, calculer_rdv_mois(id, '2026-11-01') AS rdv
FROM medecins ORDER BY rdv DESC LIMIT 10;
EXPLAIN ANALYZE SELECT count(*) FROM consultations
WHERE medecin_id = 42 AND date_heure >= '2026-11-01' AND date_heure < '2026-12-01';

-- On remet l'index 1.
CREATE INDEX consultations_date_idx ON consultations (date_heure);
