# Data volume, statistics function and indexes

Detailed notes on the performance part of the project. The script `benchmark_index.sql` reproduces every measurement below.

## The data

- **What it is:** 200 doctors, 10,000 patients and 1,000,000 consultations generated with `generate_series`. Each doctor has 20 half-hour slots per day (8:00–18:00).
- **Why:** with a few rows PostgreSQL always reads the whole table; you need volume for an index to make a difference and to see whether the site stays fast.
- **Proof:** `SELECT count(*) FROM consultations;` returns about one million rows.

## The function `calculer_rdv_mois`

- **What it does:** counts a doctor's non-cancelled appointments over a month. The statistics page calls it for each doctor.
- **Why:** the computation is written once, in the database, instead of in every program.
- **Proof:** `SELECT calculer_rdv_mois(42, '2026-11-01');` returns 600. After cancelling one of these appointments with `annuler_rdv`, it returns 599.

## Index 1 — `consultations (date_heure)`

- **What it does:** speeds up the home page, which shows the first 100 appointments sorted by date.
- **Why:** without an index PostgreSQL reads and sorts 1 million rows to keep 100. The index is already sorted: it reads the first 100 entries and stops.
- **Proof:** the home-page query. Before: Seq Scan, 82 ms. After: Index Scan, 0.13 ms.

## Index 2 — `consultations (medecin_id, date_heure)`

- **What it does:** speeds up `calculer_rdv_mois`, and therefore the statistics page.
- **Why:**
  - `medecin_id` is a foreign key and PostgreSQL does not index it on its own.
  - The function filters on the doctor, then on a period. The index is ordered the same way: it goes straight to the doctor, then reads that month's appointments.
- **Proof:**
  - The computation for one doctor. Before: Seq Scan, 10.9 ms. After: Index Only Scan, 0.06 ms.
  - The statistics page, which runs it for all 200 doctors. Before: 6.0 s. After: 27 ms.

**The cost:** the two indexes take 6.7 MB and 30 MB, and every new appointment must update them. A schedule is consulted far more often than it is booked, so the trade-off is worth it.
