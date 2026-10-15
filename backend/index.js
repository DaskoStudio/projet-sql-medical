// ═══════════════════════════════════════════════════════════
// PSG MEDICAL HUB — Backend API (Node.js + Express + pg)
// Centre médical interne du Paris Saint-Germain
// Projet SQL avancé — Ynov Campus B2
// ═══════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Intercepter app.js pour réécrire automatiquement toute URL localhost:3000 vers /api
app.get("/app.js", (req, res) => {
  try {
    let js = fs.readFileSync(path.join(__dirname, "..", "frontend", "app.js"), "utf8");
    js = js.replace(/https?:\/\/localhost:\d+\/api/g, "/api");
    res.type("application/javascript").send(js);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Servir le reste du frontend depuis le dossier ../frontend
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
        c.id AS consultation_id,
        c.date_heure,
        c.date_heure AS date_consultation,
        c.statut,
        m.nom   AS medecin_nom,
        m.nom   AS medecin,
        m.specialite,
        p.prenom AS patient_prenom,
        p.nom    AS patient_nom,
        CONCAT(p.prenom, ' ', p.nom) AS patient_complet
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
        nom AS medecin_nom,
        specialite, 
        calculer_rdv_mois(id, date_trunc('month', current_date)::date) as rdv_ce_mois,
        calculer_rdv_mois(id, date_trunc('month', current_date)::date) as nombre_rdv
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
  const patient_id = req.body.patient_id;
  const medecin_id = req.body.medecin_id;
  const date_heure = req.body.date_heure || req.body.date_consultation;
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
    console.error("Erreur Trigger SQL:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET — Consultation via vue_secretaire (Personne 3 : Vues & Permissions)
app.get("/api/secretaire/consultations", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        consultation_id AS id,
        consultation_id,
        patient_prenom,
        patient_nom,
        telephone,
        medecin AS medecin_nom,
        medecin,
        specialite,
        cabinet AS cabinet_nom,
        cabinet,
        ville,
        date_heure AS date_consultation,
        date_heure,
        statut
      FROM vue_secretaire
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

  let test1Ok = false;
  let test1Result = "";
  try {
    const vueRes = await secretairePool.query("SELECT COUNT(*) as nb FROM vue_secretaire");
    test1Ok = true;
    test1Result = `Succès : ${vueRes.rows[0].nb} consultations accessibles`;
  } catch (err) {
    test1Result = err.message;
  }

  let test2Blocked = true;
  let test2Result = "";
  try {
    await secretairePool.query("SELECT * FROM patients LIMIT 1");
    test2Blocked = false;
    test2Result = "Inattendu : accès direct permis";
  } catch (err) {
    test2Blocked = true;
    test2Result = `Bloqué par PostgreSQL : ${err.message}`;
  }

  await secretairePool.end();

  const tests = [
    {
      role: "role_secretaire (vue_secretaire)",
      status: test1Ok ? "OK" : "KO",
      cible: "vue_secretaire",
      action: "SELECT",
      autorise: test1Ok,
      resultat: test1Result,
      description: `Lecture de vue_secretaire : ${test1Result}`
    },
    {
      role: "role_secretaire (table patients)",
      status: test2Blocked ? "REFUSE" : "OK",
      cible: "table patients",
      action: "SELECT",
      autorise: !test2Blocked,
      resultat: test2Result,
      description: `Accès direct table patients : ${test2Result}`
    }
  ];

  res.json(tests);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`⚽ PSG Medical Hub — Backend démarré sur http://localhost:${PORT}`);
});
