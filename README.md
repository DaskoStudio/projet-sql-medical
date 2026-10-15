# ⚽ PSG Medical Hub

**Le sujet :** la base de données du centre médical du Paris Saint-Germain, sur le modèle de Doctolib. Elle relie les cabinets (Campus PSG de Poissy, infirmerie du Parc des Princes), le staff médical, les joueurs et leurs consultations.
**Le but :** prendre, afficher et annuler des rendez-vous sans jamais réserver deux fois le même créneau, protéger les données médicales des joueurs et rester rapide avec un million de consultations.

Projet de groupe · SQL avancé · Bachelor 2 · Ynov Campus · PostgreSQL 16

---

## 🗂️ Le modèle : 4 tables

| Table | Une ligne, c'est | Liens |
|---|---|---|
| `cabinets` | un lieu de soin (Campus PSG Poissy, Parc des Princes) | |
| `medecins` | un membre du staff médical (Dr. Orhant, Dr. Galland, Dr. Ferret…) | → `cabinets` |
| `patients` | un joueur (Dembélé, Hakimi, Donnarumma, Marquinhos, Vitinha…) | |
| `consultations` | un rendez-vous : médecin, joueur, date et heure, statut | → `medecins`, → `patients` |

---

## 🚀 Lancer le projet

Il faut **Docker Desktop** (lancé) et **Node.js 18+**.

```bash
# 1. La base : les scripts de db/ s'exécutent automatiquement dans l'ordre (environ 15 s)
docker compose up -d

# 2. Le serveur (laisser ce terminal ouvert)
cd backend
npm install
node index.js
```

Ouvrir ensuite **http://localhost:3001**. Le backend sert aussi l'interface.

| Paramètre | Valeur |
|---|---|
| Base | `cabinet_medical`, sur le port `5433` |
| Utilisateur | `admin` / `password` |
| Console SQL | `docker compose exec db psql -U admin -d cabinet_medical` |
| Repartir de zéro | `docker compose down -v`, puis `docker compose up -d` |

---

## 🧩 Ce que contient la base

### 1. La procédure `annuler_rdv`
- **Ce qu'elle fait :** elle passe une consultation au statut « annulé ». Si l'identifiant n'existe pas, elle refuse avec un message clair.
- **Pourquoi elle est là :** l'annulation s'écrit une seule fois, dans la base. Le site (bouton « Annuler ») et la console SQL appliquent donc exactement la même règle.
- **La preuve :** après `CALL annuler_rdv(1);`, le statut de la consultation 1 vaut `annulé`. `CALL annuler_rdv(9999999);` affiche `ERROR: La consultation 9999999 n'existe pas`.

### 2. La fonction `calculer_rdv_mois`
- **Ce qu'elle fait :** elle compte les rendez-vous non annulés d'un médecin sur un mois donné.
- **Pourquoi elle est là :** la page statistiques du site l'appelle pour chaque membre du staff. Le calcul est identique partout et n'est jamais réécrit dans l'application.
- **La preuve :** `SELECT calculer_rdv_mois(42, '2026-11-01');` renvoie 600. Après l'annulation d'un de ces rendez-vous avec `annuler_rdv`, elle renvoie 599.

### 3. Le trigger `anti_surreservation`
- **Ce qu'il fait :** avant chaque nouveau rendez-vous (`BEFORE INSERT`), il vérifie que le médecin n'a pas déjà un rendez-vous non annulé à la même heure. Si c'est le cas, il refuse l'insertion.
- **Pourquoi dans la base plutôt que dans l'application :** une double réservation doit être impossible quel que soit le chemin emprunté (site, API, console SQL, futur outil). Si la règle n'existait que dans le code du site, il suffirait d'un oubli ou d'un autre programme pour la contourner. Dans la base, elle s'applique à tout le monde, sans exception.
- **La preuve :** réserver le Dr. Orhant le 15/10 à 9 h, alors que Dembélé occupe déjà ce créneau, affiche `ERROR: Le médecin 1 a déjà un rendez-vous à cette heure — créneau refusé par le trigger anti_surreservation`. Après l'annulation du rendez-vous de Dembélé, la même réservation passe.

### 4. Les rôles
- **Ce qu'ils font :** deux rôles-métiers reçoivent les droits, `role_secretaire` et `role_medecin`. Deux utilisateurs en héritent, `secretaire_demo` et `medecin_demo`. Aucun des deux n'a de droit sur les tables, seulement sur sa vue.
- **Pourquoi ils sont là :** c'est le principe du moindre privilège. Chaque compte ne voit que ce dont il a besoin. Les droits sont donnés aux rôles et non aux personnes : si une secrétaire quitte le club, on supprime son compte sans toucher aux droits du rôle.
- **La preuve :** après `SET ROLE secretaire_demo;`, la lecture de `vue_secretaire` est **autorisée** et `SELECT numero_secu FROM patients;` est **refusée** (`permission denied for table patients`). Après `SET ROLE medecin_demo;`, un `UPDATE` sur `consultations` est **refusé**. Le même test est accessible depuis le site (`/api/securite/test-rbac`).

### 5. Les vues
- **Ce qu'elles font :**
  - `vue_secretaire` montre le planning (joueur, téléphone, médecin, cabinet, ville, date, statut).
  - `vue_medecin` montre les consultations avec le joueur et son téléphone.
- **Pourquoi elles sont là :** elles **cachent le numéro de Sécurité sociale des joueurs** et évitent à l'utilisateur d'écrire les jointures. Le droit est donné sur la vue, jamais sur la table : sinon la vue ne protégerait rien.
- **La preuve :** en tant que `secretaire_demo`, `SELECT * FROM vue_secretaire LIMIT 2;` affiche « Ousmane Dembélé · Dr. Orhant · 15/10 9 h », sans aucune colonne `numero_secu`. La lecture directe de `patients` est refusée.

### 6. Les données
- **Ce qu'elles font :** 8 joueurs et 3 médecins réels saisis à la main, plus un jeu généré avec `generate_series` : **200 membres du staff, 10 000 patients et 1 000 000 de consultations**. Il y a 20 créneaux de 30 min par jour (8 h - 18 h) à partir du 17 octobre, sans aucun doublon.
- **Pourquoi elles sont là :** avec quelques lignes, PostgreSQL lit toujours toute la table, et un index ne prouve rien. Avec un million de lignes, on mesure vraiment si le site reste rapide.
- **La preuve :** `SELECT count(*) FROM consultations;` renvoie un peu plus d'un million de lignes.

### 7. Les index
Toutes les mesures sont faites avec `EXPLAIN ANALYZE`, sur les vraies requêtes du site (`analyse/benchmark_index.sql`).

**Index 1 : `consultations (date_heure)`**
- **Ce qu'il fait :** il accélère la page d'accueil, qui affiche les 100 prochains rendez-vous triés par date.
- **Pourquoi il est là :** sans index, PostgreSQL lit et trie un million de lignes pour en garder 100. L'index est déjà trié : il lit les 100 premières entrées et s'arrête.
- **La preuve :** avant, Seq Scan, **82 ms**. Après, Index Scan, **0,13 ms**.

**Index 2 : `consultations (medecin_id, date_heure)`**
- **Ce qu'il fait :** il accélère `calculer_rdv_mois`, donc la page statistiques, et le trigger anti-surréservation, qui filtrent tous sur le médecin puis sur la date.
- **Pourquoi il est là :** `medecin_id` est une clé étrangère, et PostgreSQL ne l'indexe pas tout seul. L'ordre des colonnes suit le filtre : d'abord l'égalité (un médecin), puis l'intervalle (une période).
- **La preuve :**
  - Pour un médecin sur un mois : avant, Seq Scan, **11 ms** ; après, Index Only Scan, **0,06 ms**.
  - Pour la page statistiques (200 médecins) : **6 s avant, 27 ms après**, soit environ 200 fois plus rapide.

**Le coût :** les deux index occupent environ 7 Mo et 30 Mo, et chaque nouveau rendez-vous doit les mettre à jour. On consulte un planning bien plus souvent qu'on ne réserve : le compromis est rentable.
**Un index écarté :** `medecins (nom)`. La table n'a que 200 lignes, et PostgreSQL continue de la lire en entier.

---

## 👥 Répartition du travail

| Partie | Responsable | Fichiers |
|---|---|---|
| Schéma, données de démo, procédure, backend et interface | *(à compléter)* | `01_schema.sql`, `02_donnees.sql`, `03_procedures.sql`, `backend/`, `frontend/` |
| Données de volume, fonction statistiques, index et benchmark | **Melek** | `02_donnees_volume.sql`, `03_fonction_stats.sql`, `09_index.sql`, `analyse/` |
| Trigger, rôles et vues | *(à compléter)* | `04_securite.sql` |

L'historique Git montre qui a fait quoi : chaque membre a commité son propre travail.

---

## 📂 Structure

```text
projet-sql-medical/
├── docker-compose.yml          PostgreSQL 16 (port 5433)
├── db/                         exécutés dans l'ordre au premier démarrage
│   ├── 01_schema.sql           les 4 tables
│   ├── 02_donnees.sql          joueurs, staff et cabinets du PSG
│   ├── 02_donnees_volume.sql   1 000 000 de consultations générées
│   ├── 03_fonction_stats.sql   calculer_rdv_mois
│   ├── 03_procedures.sql       annuler_rdv
│   ├── 04_securite.sql         trigger, rôles et vues
│   └── 09_index.sql            les 2 index
├── analyse/
│   ├── benchmark_index.sql     mesures avant / après chaque index
│   └── README.md               détail des mesures
├── backend/                    API Node.js / Express
└── frontend/                   interface web
```
