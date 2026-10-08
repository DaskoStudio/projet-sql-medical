-- Personne 3 : nombre de rendez-vous non annulés d'un médecin sur un mois.
-- p_mois = le 1er jour du mois, ex : SELECT calculer_rdv_mois(42, '2026-12-01');

CREATE OR REPLACE FUNCTION calculer_rdv_mois(p_medecin_id int, p_mois date)
RETURNS bigint
LANGUAGE sql
AS $$
    SELECT count(*)
    FROM consultations
    WHERE medecin_id = p_medecin_id
      AND statut <> 'annulé'
      AND date_heure >= p_mois
      AND date_heure < p_mois + interval '1 month';
$$;
