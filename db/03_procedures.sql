CREATE OR REPLACE PROCEDURE annuler_rdv(p_consultation_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE consultations 
    SET statut = 'annulé' 
    WHERE id = p_consultation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La consultation % n''existe pas', p_consultation_id;
    END IF;
    
    COMMIT;
END;
$$;
