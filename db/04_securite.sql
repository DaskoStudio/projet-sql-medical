CREATE FUNCTION verifier_surreservation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM consultations
        WHERE medecin_id = NEW.medecin_id
          AND date_heure = NEW.date_heure
          AND statut <> 'annulé'
    ) THEN
        RAISE EXCEPTION
        'Le médecin % a déjà un rendez-vous à cette heure',
        NEW.medecin_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER anti_surreservation
BEFORE INSERT ON consultations
FOR EACH ROW
EXECUTE FUNCTION verifier_surreservation();

CREATE ROLE role_secretaire NOLOGIN;
CREATE ROLE role_medecin NOLOGIN;

CREATE ROLE secretaire_demo
LOGIN PASSWORD 'secretaire'
IN ROLE role_secretaire;

CREATE ROLE medecin_demo
LOGIN PASSWORD 'medecin'
IN ROLE role_medecin;

CREATE VIEW vue_secretaire AS
SELECT
    c.id AS consultation_id,
    p.prenom AS patient_prenom,
    p.nom AS patient_nom,
    p.telephone,
    m.nom AS medecin,
    m.specialite,
    ca.nom AS cabinet,
    ca.ville,
    c.date_heure,
    c.statut
FROM consultations c
JOIN patients p ON p.id = c.patient_id
JOIN medecins m ON m.id = c.medecin_id
JOIN cabinets ca ON ca.id = m.cabinet_id;
GRANT SELECT ON vue_secretaire TO role_secretaire;

CREATE VIEW vue_medecin AS
SELECT
    c.id AS consultation_id,
    c.medecin_id,
    p.prenom AS patient_prenom,
    p.nom AS patient_nom,
    p.telephone,
    c.date_heure,
    c.statut
FROM consultations c
JOIN patients p ON p.id = c.patient_id;
GRANT SELECT ON vue_medecin TO role_medecin;