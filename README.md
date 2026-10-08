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
- Génération d'un jeu de données réaliste (`02_donnees.sql`).
- Création de la **procédure stockée** d'annulation de rendez-vous avec libération du créneau (`03_procedures.sql`).
- Développement du backend Node.js et de l'interface graphique.

### 👤 Personne 2 : Analyste & Sécurité (À faire ⏳)
- Création de **vues SQL** pour les requêtes complexes (ex: tableau de bord journalier des médecins, historique des patients).
- Mise en place de **Triggers** pour automatiser la gestion (ex: table d'audit pour tracer qui annule quoi et quand).
- Ajout d'Index pour optimiser les requêtes lourdes (si nécessaire).

### 👤 Personne 3 : Expert Optimisation & DBA (À faire ⏳)
- Mise en place de la **Recherche Full-Text** (recherche rapide d'un patient par nom/prénom).
- Création de **vues matérialisées** pour optimiser les calculs statistiques mensuels/annuels.
- Partitionnement des tables (si le volume de données le justifie) et mise en place d'une routine de Backup.

---

## 📂 Structure du projet

```text
projet-sql-medical/
├── docker-compose.yml       # Configuration du conteneur PostgreSQL
├── README.md                # Documentation du projet
│
├── db/                      # Scripts SQL (exécutés au build du conteneur)
│   ├── 01_schema.sql        # Création des tables (Personne 1)
│   ├── 02_donnees.sql       # Données de base (Personne 1)
│   └── 03_procedures.sql    # Procédures stockées (Personne 1)
│   # Les prochains fichiers SQL iront ici (04_vues.sql, 05_triggers.sql...)
│
├── backend/                 # API Node.js / Express
│   ├── index.js             # Routes et connexion DB
│   ├── package.json
│   └── package-lock.json
│
└── frontend/                # Interface Utilisateur
    ├── index.html           # Structure de la page et CSS
    └── app.js               # Logique d'affichage et appels à l'API
```
