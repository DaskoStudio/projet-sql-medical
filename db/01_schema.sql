-- 1. La table des cabinets médicaux
CREATE TABLE cabinets (
    id serial PRIMARY KEY,
    nom varchar(100) NOT NULL,
    ville varchar(100) NOT NULL
);

-- 2. La table des patients
CREATE TABLE patients (
    id serial PRIMARY KEY,
    prenom varchar(50) NOT NULL,
    nom varchar(50) NOT NULL,
    telephone varchar(15),
    numero_secu varchar(15) UNIQUE
);

-- 3. La table des médecins
CREATE TABLE medecins (
    id serial PRIMARY KEY,
    nom varchar(50) NOT NULL,
    specialite varchar(50) NOT NULL,
    cabinet_id int REFERENCES cabinets(id)
);

-- 4. La table des rendez-vous
CREATE TABLE consultations (
    id serial PRIMARY KEY,
    medecin_id int REFERENCES medecins(id),
    patient_id int REFERENCES patients(id),
    date_heure timestamp NOT NULL,
    statut varchar(20) DEFAULT 'planifié' -- (planifié, annulé, terminé)
);
