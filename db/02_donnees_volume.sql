-- Personne 3 : 100 000 consultations pour mesurer les index.
-- 47 médecins de plus (50 au total), 20 créneaux de 30 min par jour à partir de 8 h,
-- sur 100 jours à partir du 1er novembre 2026.

INSERT INTO medecins (nom, specialite, cabinet_id)
SELECT 'Dr. Medecin ' || i, 'Généraliste', 1 + (i % 2)
FROM generate_series(4, 50) AS i;

INSERT INTO consultations (medecin_id, patient_id, date_heure)
SELECT 1 + (i % 50),
       1 + (i % 3),
       timestamp '2026-11-01 08:00'
         + (i / 1000)       * interval '1 day'
         + ((i / 50) % 20)  * interval '30 minutes'
FROM generate_series(0, 99999) AS i;

ANALYZE;
