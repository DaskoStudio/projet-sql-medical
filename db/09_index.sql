-- les deux index (mesures dans analyse/benchmark_index.sql)

-- Le planning trié par date (page d'accueil du site)
CREATE INDEX consultations_date_idx ON consultations (date_heure);

-- L'agenda d'un médecin sur une période (page statistiques, calculer_rdv_mois)
CREATE INDEX consultations_medecin_date_idx ON consultations (medecin_id, date_heure);
