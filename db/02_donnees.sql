-- ═══════════════════════════════════════════════════════════
-- PSG MEDICAL HUB — Jeu de données initial
-- Centre médical interne du Paris Saint-Germain
-- ═══════════════════════════════════════════════════════════

INSERT INTO cabinets (nom, ville) VALUES 
('Centre Ooredoo — Campus PSG', 'Poissy'),
('Parc des Princes — Infirmerie', 'Paris');

INSERT INTO patients (prenom, nom, telephone, numero_secu) VALUES 
('Ousmane', 'Dembélé', '0601020304', '197081234567801'),
('Achraf', 'Hakimi', '0611223344', '198111234567802'),
('Gianluigi', 'Donnarumma', '0700112233', '199021234567803'),
('Marquinhos', 'Corrêa', '0622334455', '194051234567804'),
('Vitinha', 'Ferreira', '0633445566', '200021234567805'),
('Warren', 'Zaïre-Emery', '0644556677', '200061234567806'),
('Bradley', 'Barcola', '0655667788', '200291234567807'),
('Randal', 'Kolo Muani', '0666778899', '199811234567808');

INSERT INTO medecins (nom, specialite, cabinet_id) VALUES 
('Dr. Orhant', 'Médecine du Sport', 1),
('Dr. Galland', 'Chirurgie Orthopédique', 1),
('Dr. Ferret', 'Kinésithérapie', 2);

INSERT INTO consultations (medecin_id, patient_id, date_heure, statut) VALUES 
(1, 1, '2026-10-15 09:00:00', 'planifié'),
(1, 2, '2026-10-15 09:30:00', 'planifié'),
(2, 3, '2026-10-15 10:00:00', 'planifié'),
(3, 4, '2026-10-15 11:00:00', 'terminé'),
(1, 5, '2026-10-15 14:00:00', 'planifié'),
(2, 6, '2026-10-16 09:00:00', 'planifié'),
(3, 7, '2026-10-16 10:30:00', 'planifié'),
(1, 8, '2026-10-16 14:00:00', 'planifié');
