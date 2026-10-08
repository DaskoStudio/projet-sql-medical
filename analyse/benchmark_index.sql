-- Personne 3 : mesure de chaque requête avant et après son index.
-- Chaque mesure est lancée deux fois : on garde la seconde.

DROP INDEX IF EXISTS consultations_date_idx;
DROP INDEX IF EXISTS consultations_medecin_idx;

\echo '--- Index 1, AVANT : les consultations du 15 novembre'
EXPLAIN ANALYZE SELECT * FROM consultations
WHERE date_heure >= '2026-11-15' AND date_heure < '2026-11-16';
EXPLAIN ANALYZE SELECT * FROM consultations
WHERE date_heure >= '2026-11-15' AND date_heure < '2026-11-16';

CREATE INDEX consultations_date_idx ON consultations (date_heure);

\echo '--- Index 1, APRÈS'
EXPLAIN ANALYZE SELECT * FROM consultations
WHERE date_heure >= '2026-11-15' AND date_heure < '2026-11-16';
EXPLAIN ANALYZE SELECT * FROM consultations
WHERE date_heure >= '2026-11-15' AND date_heure < '2026-11-16';

\echo '--- Index 2, AVANT : les consultations du médecin 42'
EXPLAIN ANALYZE SELECT * FROM consultations WHERE medecin_id = 42;
EXPLAIN ANALYZE SELECT * FROM consultations WHERE medecin_id = 42;

CREATE INDEX consultations_medecin_idx ON consultations (medecin_id);

\echo '--- Index 2, APRÈS'
EXPLAIN ANALYZE SELECT * FROM consultations WHERE medecin_id = 42;
EXPLAIN ANALYZE SELECT * FROM consultations WHERE medecin_id = 42;
