-- Création de la procédure pour annuler un rendez-vous
CREATE OR REPLACE PROCEDURE annuler_rdv(p_consultation_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- On vérifie si la consultation existe et on la passe en "annulé"
    UPDATE consultations 
    SET statut = 'annulé' 
    WHERE id = p_consultation_id;
    
    -- Si aucune ligne n'a été modifiée, c'est que l'ID n'existe pas
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La consultation % n''existe pas', p_consultation_id;
    END IF;
    
    COMMIT;
END;
$$;
