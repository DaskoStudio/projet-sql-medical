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

// Empêcher l'application Node de planter si la DB redémarre
pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL', err);
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

// POST — Annuler une consultation via la procédure stockée (Personne 1)
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

// GET — Liste des médecins (pour sélection et filtres)
app.get("/api/medecins", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nom, specialite FROM medecins ORDER BY nom ASC LIMIT 100");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET — Liste des patients (pour sélection dans le formulaire)
app.get("/api/patients", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, prenom, nom, telephone FROM patients ORDER BY nom ASC LIMIT 50");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST — Créer une consultation (Déclenche le trigger anti_surreservation de Personne 3)
app.post("/api/consultations", async (req, res) => {
  const { patient_id, medecin_id, date_heure } = req.body;
  if (!patient_id || !medecin_id || !date_heure) {
    return res.status(400).json({ error: "Données incomplètes (patient_id, medecin_id, date_heure requis)" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO consultations (patient_id, medecin_id, date_heure, statut)
       VALUES ($1, $2, $3, 'planifié')
       RETURNING *`,
      [patient_id, medecin_id, date_heure]
    );
    res.status(201).json({ message: "Rendez-vous créé avec succès", consultation: result.rows[0] });
  } catch (err) {
    // Si le trigger PostgreSQL anti_surreservation lève une exception
    console.error("Erreur Trigger SQL:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET — Consultation via vue_secretaire (Personne 3 : Vues & Permissions)
app.get("/api/secretaire/consultations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM vue_secretaire
      ORDER BY date_heure ASC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET — Test sécurité RBAC (Personne 3 : Rôles PostgreSQL)
app.get("/api/securite/test-rbac", async (req, res) => {
  const secretairePool = new Pool({
    host: "127.0.0.1",
    port: 5433,
    user: "secretaire_demo",
    password: "secretaire",
    database: "cabinet_medical",
  });

  const testReport = {
    role: "role_secretaire",
    utilisateur: "secretaire_demo",
    tests: []
  };

  try {
    // Test 1 : Accès autorisé à vue_secretaire
    const vueRes = await secretairePool.query("SELECT COUNT(*) as nb FROM vue_secretaire");
    testReport.tests.push({
      cible: "vue_secretaire",
      action: "SELECT",
      autorise: true,
      resultat: `Succès : ${vueRes.rows[0].nb} lignes accessibles`
    });
  } catch (err) {
    testReport.tests.push({
      cible: "vue_secretaire",
      action: "SELECT",
      autorise: false,
      resultat: err.message
    });
  }

  try {
    // Test 2 : Tentative d'accès interdit à la table directe patients
    await secretairePool.query("SELECT * FROM patients LIMIT 1");
    testReport.tests.push({
      cible: "table patients (direct)",
      action: "SELECT",
      autorise: true,
      resultat: "Inattendu : accès permis"
    });
  } catch (err) {
    testReport.tests.push({
      cible: "table patients (direct)",
      action: "SELECT",
      autorise: false,
      resultat: `Bloqué par PostgreSQL : ${err.message}`
    });
  }

  await secretairePool.end();
  res.json(testReport);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
});
