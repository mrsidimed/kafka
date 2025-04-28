#!/bin/bash
set -e

# Create the 'cartegrise' database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE cartegrise;
EOSQL

# Connect to the 'cartegrise' database and create the 'certificat' table
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "cartegrise" <<-EOSQL
-- Create the tables

-- Table: certificat
CREATE TABLE certificat (
    id_certificat SERIAL PRIMARY KEY,
    sent INT,
    sequance_matricule VARCHAR(255),
    id_prop INT,
    id_etablissement INT,
    id_pays INT,
    date_vente DATE,
    type_demande VARCHAR(255),
    id_veh INT,-- Assuming there is a column for vehicle id
    etat_wf VARCHAR(255),
    centre VARCHAR(10),
    montant numeric(8,2)
);

-- Table: vehicule
CREATE TABLE vehicule (
    id_veh INT PRIMARY KEY,
    num_chassus VARCHAR(255),
    marque VARCHAR(255),
    typev VARCHAR(255),
    id_genre INT,
    puissance INT,
    poids_charge FLOAT,
    poids_vide FLOAT,
    nbr_places INT
);

-- Table: genre
CREATE TABLE genre (
    id_genre INT PRIMARY KEY,
    libelle_genre VARCHAR(255),
    type VARCHAR(255)
);

-- Table: properietair
CREATE TABLE properietaire (
    nni INT PRIMARY KEY,
    nom_complet_prop VARCHAR(255)
);

-- Table: etablissement
CREATE TABLE etablissement (
    id_etablissement INT PRIMARY KEY,
    libellefr VARCHAR(255)
);

-- Table: pays
CREATE TABLE pays (
    id_pays INT PRIMARY KEY,
    designation VARCHAR(255)
);

-- Table: recettes
CREATE TABLE recettes (
    id_recette SERIAL PRIMARY KEY,
    date_validation TIMESTAMP,
    path VARCHAR(255),
    paiement_en_ligne smallint NOT NULL DEFAULT 0,
    etat VARCHAR(255),
    date_quittance DATE,
    reference VARCHAR(255),
    serviceBancaire VARCHAR(255),
    idTransaction VARCHAR(255),
    Quittance VARCHAR(255),
    numeroTelephone VARCHAR(255),
    quittance_pdf TEXT,
    numero_recette VARCHAR(255)
);

-- Table: type_genre
CREATE TABLE type_genre (
    id_type_genre SERIAL PRIMARY KEY,
    type VARCHAR(255),
    nb_place_max INT,
    nb_place_min INT,
    poid_max FLOAT,
    poid_min FLOAT,
    immatriculation FLOAT,
    mutation_hors_delai FLOAT,
    mutation_dans_delai FLOAT,
    remplacement FLOAT,
    duplicata FLOAT
);

-- Insert some sample data into the tables

-- Insert data into certificat
INSERT INTO certificat (sent, sequance_matricule, id_prop, id_etablissement, id_pays, date_vente, type_demande, id_veh, etat_wf)
VALUES (0, 'SM12345', 1, 1, 1, '2022-01-01', 'sample_type', 1, 'validé_douane');

-- Insert data into vehicule
INSERT INTO vehicule (id_veh, num_chassus, marque, typev, id_genre, puissance, poids_charge, poids_vide, nbr_places)
VALUES (1, 'VN12345', 'Toyota', 'Sedan', 1, 100, 1500, 1000, 5);

-- Insert data into genre
INSERT INTO genre (id_genre, libelle_genre, type)
VALUES (1, 'Sedan', 'VP');

-- Insert data into properietair
INSERT INTO properietaire (nni, nom_complet_prop)
VALUES (1, 'John Doe');

-- Insert data into etablissement
INSERT INTO etablissement (id_etablissement, libellefr)
VALUES (1, 'Etablissement A');

-- Insert data into pays
INSERT INTO pays (id_pays, designation)
VALUES (1, 'Country A');

-- Insert data into recettes
INSERT INTO recettes (date_validation, path, paiement_en_ligne, etat, date_quittance, reference, serviceBancaire, idTransaction, Quittance, numeroTelephone, quittance_pdf, numero_recette)
VALUES (NOW(), 'path/to/file', 1, 'Reçue', '2022-01-01', 'REF123', 'Service A', 'TRANS123', 'QUITT123', '1234567890', 'PDFB64', 'REC123');

-- Insert data into type_genre
INSERT INTO type_genre (type, nb_place_max, nb_place_min, poid_max, poid_min, immatriculation, mutation_hors_delai, mutation_dans_delai, remplacement, duplicata)
VALUES ('VP', 7, 4, 2000, 1000, 300, 500, 250, 150, 100);
EOSQL
