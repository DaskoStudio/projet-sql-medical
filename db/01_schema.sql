CREATE TABLE cabinets (
    id serial PRIMARY KEY,
    nom varchar(100) NOT NULL,
    ville varchar(100) NOT NULL
);

CREATE TABLE patients (
    id serial PRIMARY KEY,
    prenom varchar(50) NOT NULL,
    nom varchar(50) NOT NULL,
    telephone varchar(15),
    numero_secu varchar(15) UNIQUE
);

CREATE TABLE medecins (
    id serial PRIMARY KEY,
    nom varchar(50) NOT NULL,
    specialite varchar(50) NOT NULL,
    cabinet_id int REFERENCES cabinets(id)
);

CREATE TABLE consultations (
    id serial PRIMARY KEY,
    medecin_id int REFERENCES medecins(id),
    patient_id int REFERENCES patients(id),
    date_heure timestamp NOT NULL,
    statut varchar(20) DEFAULT 'planifié'
);
