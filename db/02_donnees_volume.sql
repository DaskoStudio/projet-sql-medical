-- volume de données pour mesurer les index.
-- 200 médecins, 10 000 patients, 1 000 000 de consultations.
-- 20 créneaux de 30 min par jour (8 h - 18 h), à partir du 13 octobre 2026.

INSERT INTO medecins (nom, specialite, cabinet_id)
SELECT 'Dr. Medecin ' || i, 'Généraliste', 1 + (i % 2)
FROM generate_series(4, 200) AS i;

INSERT INTO patients (prenom, nom, telephone, numero_secu)
SELECT 'Prenom' || i, 'Patient' || i, '06' || lpad(i::text, 8, '0'), '1' || lpad(i::text, 14, '0')
FROM generate_series(4, 10000) AS i;

INSERT INTO consultations (medecin_id, patient_id, date_heure)
SELECT 1 + (i % 200),
       1 + (i % 10000),
       timestamp '2026-10-13 08:00'
         + (i / 4000)       * interval '1 day'
         + ((i / 200) % 20) * interval '30 minutes'
FROM generate_series(0, 999999) AS i;

ANALYZE;
