-- Personne 3 : les deux index (mesures dans analyse/benchmark_index.sql)

-- Le planning d'une journée
CREATE INDEX consultations_date_idx ON consultations (date_heure);

-- L'agenda d'un médecin (clé étrangère, non indexée par PostgreSQL)
CREATE INDEX consultations_medecin_idx ON consultations (medecin_id);
