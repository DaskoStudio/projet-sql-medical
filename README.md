# PSG Medical Hub

> The database of a football club's medical centre, modelled on a Doctolib-style booking system: clinics, medical staff, players and consultations — with double-booking protection, role-based access and measured query performance on one million rows.

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Type](https://img.shields.io/badge/type-group%20project-38f0c0?style=flat-square)

**Subject.** The medical centre of a professional football club (Campus PSG in Poissy, infirmary at the Parc des Princes) links clinics, medical staff, players and consultations.
**Goal.** Book, display and cancel appointments without ever booking the same slot twice, protect players' medical data, and stay fast with a million consultations.

Group project · advanced SQL · PostgreSQL 16. All data is demo data.

---

## Table of contents

- [Data model](#data-model)
- [Getting started](#getting-started)
- [What the database contains](#what-the-database-contains)
- [Team](#team)
- [Project structure](#project-structure)

## Data model

Four tables:

| Table | One row is… | Links |
|---|---|---|
| `cabinets` | a care location (Campus PSG Poissy, Parc des Princes) | |
| `medecins` | a member of the medical staff | → `cabinets` |
| `patients` | a player | |
| `consultations` | an appointment: doctor, player, date and time, status | → `medecins`, → `patients` |

## Getting started

You need **Docker Desktop** (running) and **Node.js 18+**.

```bash
# 1. The database: scripts in db/ run automatically in order (about 15 s)
docker compose up -d

# 2. The server (keep this terminal open)
cd backend
npm install
node index.js
```

Then open **http://localhost:3001** — the backend also serves the web interface.

| Setting | Value |
|---|---|
| Database | `cabinet_medical` on port `5433` |
| Local credentials | `admin` / `password` (local development only) |
| SQL console | `docker compose exec db psql -U admin -d cabinet_medical` |
| Start from scratch | `docker compose down -v`, then `docker compose up -d` |

---

## What the database contains

### 1. Procedure `annuler_rdv`
- **What it does:** sets a consultation's status to "cancelled". If the id does not exist, it refuses with a clear message.
- **Why it exists:** cancellation is written once, in the database, so the website's "Cancel" button and the SQL console apply exactly the same rule.
- **Proof:** after `CALL annuler_rdv(1);` consultation 1 has status `annulé`. `CALL annuler_rdv(9999999);` prints `ERROR: La consultation 9999999 n'existe pas`.

### 2. Function `calculer_rdv_mois`
- **What it does:** counts a doctor's non-cancelled appointments for a given month.
- **Why it exists:** the statistics page calls it for each staff member; the computation is identical everywhere and never rewritten in the application.
- **Proof:** `SELECT calculer_rdv_mois(42, '2026-11-01');` returns 600. After cancelling one of those appointments with `annuler_rdv`, it returns 599.

### 3. Trigger `anti_surreservation`
- **What it does:** before every new appointment (`BEFORE INSERT`) it checks that the doctor has no other non-cancelled appointment at the same time, and rejects the insert if so.
- **Why in the database rather than the application:** a double booking must be impossible whatever the path — website, API, SQL console, a future tool. A rule that only lived in the site's code could be bypassed by a mistake or by another program. In the database, it applies to everyone.
- **Proof:** booking a doctor at a slot already taken prints `ERROR: Le médecin 1 a déjà un rendez-vous à cette heure — créneau refusé par le trigger anti_surreservation`. After cancelling the existing appointment, the same booking succeeds.

### 4. Roles
- **What they do:** two business roles receive privileges, `role_secretaire` and `role_medecin`; two users inherit them, `secretaire_demo` and `medecin_demo`. Neither has any right on the tables — only on its own view.
- **Why:** least privilege. Each account sees only what it needs, and rights are granted to roles rather than people: when a secretary leaves, you drop the account without touching the role.
- **Proof:** after `SET ROLE secretaire_demo;`, reading `vue_secretaire` is **allowed** and `SELECT numero_secu FROM patients;` is **denied** (`permission denied for table patients`). After `SET ROLE medecin_demo;`, an `UPDATE` on `consultations` is **denied**. The same test is available from the site (`/api/securite/test-rbac`).

### 5. Views
- **What they do:** `vue_secretaire` shows the schedule (player, phone, doctor, clinic, city, date, status); `vue_medecin` shows consultations with the player and phone number.
- **Why:** they **hide players' social-security numbers** and spare users from writing joins. The privilege is granted on the view, never on the table — otherwise the view would protect nothing.
- **Proof:** as `secretaire_demo`, `SELECT * FROM vue_secretaire LIMIT 2;` returns the schedule without any `numero_secu` column; reading `patients` directly is denied.

### 6. Data
- **What it is:** a few players and doctors entered by hand, plus a generated dataset built with `generate_series`: **200 staff members, 10,000 patients and 1,000,000 consultations**, with 20 half-hour slots a day (8:00–18:00) and no duplicates.
- **Why:** with a few rows PostgreSQL always reads the whole table and an index proves nothing. With a million rows you can really measure whether the site stays fast.
- **Proof:** `SELECT count(*) FROM consultations;` returns a little over one million rows.

### 7. Indexes
All measurements use `EXPLAIN ANALYZE` on the site's real queries (`analyse/benchmark_index.sql`).

**Index 1 — `consultations (date_heure)`**
- **What it does:** speeds up the home page, which lists the next 100 appointments sorted by date.
- **Why:** without an index PostgreSQL reads and sorts a million rows to keep 100. The index is already sorted: it reads the first 100 entries and stops.
- **Proof:** before, Seq Scan, **82 ms**. After, Index Scan, **0.13 ms**.

**Index 2 — `consultations (medecin_id, date_heure)`**
- **What it does:** speeds up `calculer_rdv_mois` (and therefore the statistics page) and the anti-double-booking trigger, which both filter on the doctor and then on the date.
- **Why:** `medecin_id` is a foreign key and PostgreSQL does not index it automatically. Column order follows the filter: equality first (one doctor), then range (a period).
- **Proof:**
  - One doctor, one month: Seq Scan **11 ms** → Index Only Scan **0.06 ms**.
  - Statistics page (200 doctors): **6 s → 27 ms**, roughly 200× faster.

**The cost:** the two indexes take about 7 MB and 30 MB, and every new appointment must update them. A schedule is read far more often than it is written, so the trade-off pays off.
**An index rejected:** `medecins (nom)` — the table has only 200 rows and PostgreSQL still reads it whole.

---

## Team

Group project. The volume data, statistics function, indexes and benchmark were written by **Melek**; the rest was built by the team. The Git history shows who did what — each member committed their own work.

## Project structure

```text
projet-sql-medical/
├── docker-compose.yml          PostgreSQL 16 (port 5433)
├── db/                         run in order on first start
│   ├── 01_schema.sql           the 4 tables
│   ├── 02_donnees.sql          demo players, staff and clinics
│   ├── 02_donnees_volume.sql   1,000,000 generated consultations
│   ├── 03_fonction_stats.sql   calculer_rdv_mois
│   ├── 03_procedures.sql       annuler_rdv
│   ├── 04_securite.sql         trigger, roles and views
│   └── 09_index.sql            the 2 indexes
├── analyse/
│   ├── benchmark_index.sql     before / after measurements
│   └── README.md               measurement details
├── backend/                    Node.js / Express API
└── frontend/                   web interface
```

---

**Author** — Konaté Adama · [github.com/DaskoStudio](https://github.com/DaskoStudio)
