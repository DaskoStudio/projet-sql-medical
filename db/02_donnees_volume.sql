-- ═══════════════════════════════════════════════════════════
-- PSG MEDICAL HUB — Volume de données pour benchmark index
-- 200 médecins, 10 000 joueurs/staff, 1 000 000 consultations
-- 20 créneaux de 30 min par jour (8 h - 18 h), à partir du 15 octobre 2026.
-- ═══════════════════════════════════════════════════════════

INSERT INTO medecins (nom, specialite, cabinet_id)
SELECT 'Dr. Staff ' || i,
       CASE i % 4
           WHEN 0 THEN 'Médecine du Sport'
           WHEN 1 THEN 'Kinésithérapie'
           WHEN 2 THEN 'Chirurgie Orthopédique'
           WHEN 3 THEN 'Nutrition Sportive'
       END,
       1 + (i % 2)
FROM generate_series(4, 200) AS i;

INSERT INTO patients (prenom, nom, telephone, numero_secu)
SELECT 'Joueur' || i, 'PSG' || i, '06' || lpad(i::text, 8, '0'), '1' || lpad(i::text, 14, '0')
FROM generate_series(9, 10000) AS i;

INSERT INTO consultations (medecin_id, patient_id, date_heure)
SELECT 1 + (i % 200),
       1 + (i % 10000),
       timestamp '2026-10-15 08:00'
         + (i / 4000)       * interval '1 day'
         + ((i / 200) % 20) * interval '30 minutes'
FROM generate_series(0, 999999) AS i;

ANALYZE;
