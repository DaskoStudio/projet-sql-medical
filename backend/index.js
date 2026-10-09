const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Servir le frontend depuis le dossier ../frontend
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Connexion PostgreSQL
const pool = new Pool({
  host: "127.0.0.1",
  port: 5433,
  user: "admin",
  password: "password",
  database: "cabinet_medical",
});

// GET — Consultations à venir (avec nom médecin + patient)
app.get("/api/consultations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.date_heure,
        c.statut,
        m.nom   AS medecin_nom,
        m.specialite,
        p.prenom AS patient_prenom,
        p.nom    AS patient_nom
      FROM consultations c
      JOIN medecins m ON c.medecin_id = m.id
      JOIN patients p ON c.patient_id = p.id
      ORDER BY c.date_heure ASC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET — Statistiques par médecin pour le mois en cours
app.get("/api/stats", async (req, res) => {
  try {
    // On utilise la fonction SQL 'calculer_rdv_mois' créée par Personne 2
    const result = await pool.query(`
      SELECT 
        id, 
        nom, 
        specialite, 
        calculer_rdv_mois(id, date_trunc('month', current_date)::date) as rdv_ce_mois
      FROM medecins
      ORDER BY rdv_ce_mois DESC
      LIMIT 10;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST — Annuler une consultation via la procédure stockée
app.post("/api/consultations/:id/annuler", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("CALL annuler_rdv($1)", [parseInt(id)]);
    res.json({ message: "Consultation annulée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});
