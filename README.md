# 🏥 Projet Base de Données Avancée — Cabinet Médical (Doctolib-like)

Bienvenue sur le dépôt du projet de gestion de cabinet médical. Ce projet a pour but d'illustrer la conception et l'optimisation d'une base de données **PostgreSQL** couplée à une interface web simple.

---

## 🛠️ Stack Technique
- **Base de données :** PostgreSQL 16 (conteneurisé avec Docker)
- **Backend :** Node.js & Express.js (API REST)
- **Frontend :** HTML, CSS (Vanilla), JS (Fetch API)

---

## 🚀 Installation et Lancement

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé.
- [Node.js](https://nodejs.org/) (version 18+ recommandée).

### 1️⃣ Lancer la base de données (PostgreSQL)
À la racine du projet, exécutez la commande suivante pour créer et démarrer le conteneur Docker. 
*(Les scripts de création de tables et d'insertion de données s'exécuteront automatiquement)*.
```bash
docker compose up -d
```
> **Note :** La base de données tourne sur le port `5433` (pour éviter les conflits avec un PostgreSQL local).
> Utilisateur : `admin` | Mot de passe : `password`

### 2️⃣ Lancer le Backend (API)
Ouvrez un terminal, placez-vous dans le dossier `backend` et lancez le serveur Node.js :
```bash
cd backend
npm install
node index.js
```
L'API tournera sur `http://localhost:3000`. Laissez ce terminal ouvert.

### 3️⃣ Lancer le Frontend (Interface Web)
Ouvrez simplement le fichier `index.html` situé dans le dossier `frontend` dans n'importe quel navigateur web.
```bash
# Sur macOS, depuis la racine du projet :
open frontend/index.html
```

---

## 👥 Répartition des Tâches (Travail de Groupe)

Le projet est divisé en 3 rôles distincts pour couvrir l'ensemble des concepts de bases de données avancées.

### 👤 Personne 1 : Architecte & Développeur Lead (Déjà fait ✅)
- Conception du modèle conceptuel (MLD) et création des tables (`01_schema.sql`).
- Jeu de données de base de démonstration (`02_donnees.sql`).
- Création de la **procédure stockée** d'annulation de rendez-vous avec libération du créneau (`03_procedures.sql`).
- Développement du backend Node.js, API REST et architecture de base.

### 👤 Personne 2 : Analyste Données & Performances (Déjà fait ✅)
- Génération d'un volume de données réaliste (1 000 000 consultations, 10 000 patients, 200 médecins) (`02_donnees_volume.sql`).
- Fonction PL/pgSQL `calculer_rdv_mois` pour calculer dynamiquement le volume d'activité mensuelle par médecin (`03_fonction_stats.sql`).
- Création d'**Index B-Tree** ciblés sur `date_heure` et `medecin_id` divisant le temps de calcul par 10 (`09_index.sql`).
- Rédaction du rapport de benchmark et des plans d'exécution `EXPLAIN ANALYZE` (`analyse/README.md`).

### 👤 Personne 3 : Sécurité, Rôles & Intégrité Métier (Déjà fait ✅)
- **Contrôle d'accès basé sur les rôles (RBAC) :** Définition des rôles `role_secretaire`, `role_medecin` et création des comptes `secretaire_demo` et `medecin_demo` (`04_securite.sql`).
- **Vues sécurisées (Principe du moindre privilège) :** 
  - `vue_secretaire` : affiche le planning, les coordonnées et le cabinet tout en masquant les informations médicales sensibles avec `GRANT SELECT`.
  - `vue_medecin` : affiche le planning spécifique au praticien.
- **Trigger d'intégrité métier :** `anti_surreservation` (`verifier_surreservation()`) bloquant au niveau du moteur PostgreSQL toute tentative de double réservation sur un même créneau pour un même praticien.
- *(Toutes ces fonctionnalités sont reliées et testables en direct depuis l'interface web !)*

---

## 📂 Structure du projet

```text
projet-sql-medical/
├── docker-compose.yml       # Configuration du conteneur PostgreSQL 16 (port 5433)
├── README.md                # Documentation complète du projet
│
├── db/                      # Scripts SQL (exécutés automatiquement par Docker)
│   ├── 01_schema.sql        # Schéma relationnel (Personne 1)
│   ├── 02_donnees.sql       # Données de test initiales (Personne 1)
│   ├── 02_donnees_volume.sql# Générateur de 1 000 000 consultations (Personne 2)
│   ├── 03_procedures.sql    # Procédure stockée annuler_rdv (Personne 1)
│   ├── 03_fonction_stats.sql# Fonction de calcul mensuel (Personne 2)
│   ├── 04_securite.sql      # Rôles, vues sécurisées et trigger anti-surréservation (Personne 3)
│   └── 09_index.sql         # Index d'optimisation de requêtes (Personne 2)
│
├── analyse/                 # Benchmarks de performance (Personne 2)
│   ├── README.md            # Rapport d'analyse et résultats EXPLAIN ANALYZE
│   └── benchmark_index.sql  # Requêtes de test avec et sans index
│
├── backend/                 # API REST Node.js & Express
│   ├── index.js             # Routes, procédures stockées, triggers et contrôle RBAC
│   ├── package.json
│   └── package-lock.json
│
└── frontend/                # Interface Utilisateur Web
    ├── index.html           # Dashboard, modales de prise de RDV et diagnostic RBAC
    └── app.js               # Logique interactive et gestion des réponses d'erreurs SQL
```
