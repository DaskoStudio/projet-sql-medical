-- Insertion des cabinets
INSERT INTO cabinets (nom, ville) VALUES 
('Centre Médical de l''Europe', 'Paris'),
('Cabinet des Tilleuls', 'Lyon');

-- Insertion des patients
INSERT INTO patients (prenom, nom, telephone, numero_secu) VALUES 
('Jean', 'Dupont', '0601020304', '190017512345678'),
('Marie', 'Martin', '0611223344', '285037598765432'),
('Lucas', 'Bernard', '0700112233', '192057534567890');

-- Insertion des médecins
INSERT INTO medecins (nom, specialite, cabinet_id) VALUES 
('Dr. House', 'Généraliste', 1),
('Dr. Mamour', 'Chirurgien', 1),
('Dr. Quinn', 'Généraliste', 2);

-- Insertion de quelques consultations
INSERT INTO consultations (medecin_id, patient_id, date_heure, statut) VALUES 
(1, 1, '2026-10-12 09:00:00', 'planifié'),
(1, 2, '2026-10-12 09:30:00', 'planifié'),
(2, 3, '2026-10-12 10:00:00', 'planifié'),
(3, 1, '2026-10-12 11:00:00', 'terminé');
