const API = "http://localhost:3000/api";
const app = document.getElementById("app");
const toast = document.getElementById("toast");

let allConsultations = [];
let upcoming = [];
let visibleCount = 5;
let currentView = "standard"; // 'standard' ou 'secretaire'
let patientsList = [];
let medecinsList = [];

// ─── Helpers ───

function formatDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function initials(prenom, nom) {
  if (!prenom && !nom) return "??";
  return ((prenom ? prenom[0] : "") + (nom ? nom[0] : "")).toUpperCase();
}

function docName(nom) {
  if (!nom) return "Dr. Inconnu";
  return nom.startsWith("Dr") ? nom : `Dr. ${nom}`;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function isToday(d) {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isThisWeek(d) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

// ─── Header date ───
(function setHeaderDate() {
  const el = document.getElementById("header-date");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
})();

// ─── Stats boxes ───

function updateStatBoxes() {
  const now = new Date();
  const todayCount = upcoming.filter(c => isToday(new Date(c.date_heure))).length;
  const weekCount = upcoming.filter(c => isThisWeek(new Date(c.date_heure))).length;

  document.getElementById("stat-total").textContent = upcoming.length;
  document.getElementById("stat-today").textContent = todayCount;
  document.getElementById("stat-week").textContent = weekCount;
}

// ─── Render cards ───

function renderConsultations(data) {
  const moreContainer = document.getElementById("more-container");

  if (data.length === 0) {
    app.innerHTML = `
      <div class="empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>Aucune consultation trouvée</p>
      </div>`;
    moreContainer.innerHTML = "";
    return;
  }

  const visible = data.slice(0, visibleCount);

  app.innerHTML = visible
    .map((c, i) => {
      const { date, time } = formatDate(c.date_heure);
      const ini = initials(c.patient_prenom, c.patient_nom);
      const id = c.id || c.consultation_id;
      const medecin = c.medecin_nom || c.medecin || "Médecin";
      const cabinetBadge = c.cabinet ? `<span class="card-tag" style="background:#f1f5f9;color:#475569;">📍 ${c.cabinet} (${c.ville})</span>` : "";

      return `
    <div class="card" style="animation-delay:${i * 0.05}s">
      <div class="card-accent"></div>
      <div class="card-body">
        <div class="card-left">
          <div class="card-avatar">${ini}</div>
          <div class="card-info">
            <span class="card-patient">${c.patient_prenom || ""} ${c.patient_nom || ""}</span>
            <span class="card-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${date} · ${time}
              <span class="card-tag">${docName(medecin)} · ${c.specialite || "Généraliste"}</span>
              ${cabinetBadge}
            </span>
          </div>
        </div>
        ${c.statut === "planifié" ? `<button class="btn-cancel" onclick="annuler(${id})">Annuler</button>` : `<span class="card-tag" style="background:#fee2e2;color:#b91c1c;">Annulé</span>`}
      </div>
    </div>`;
    })
    .join("");

  if (data.length > visibleCount) {
    const remaining = data.length - visibleCount;
    moreContainer.innerHTML = `<button class="btn-more" onclick="showMore()">Voir ${remaining} autre${remaining > 1 ? "s" : ""}</button>`;
  } else {
    moreContainer.innerHTML = "";
  }
}

// ─── Show more ───

window.showMore = function () {
  visibleCount += 10;
  filterConsultations();
};

// ─── Filter ───

window.filterConsultations = function () {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();

  const filtered = upcoming.filter(c => {
    if (!search) return true;
    const patNom = (c.patient_nom || "").toLowerCase();
    const patPre = (c.patient_prenom || "").toLowerCase();
    const docNom = (c.medecin_nom || c.medecin || "").toLowerCase();
    const spec = (c.specialite || "").toLowerCase();
    const cab = (c.cabinet || "").toLowerCase();

    return patNom.includes(search) || patPre.includes(search) || docNom.includes(search) || spec.includes(search) || cab.includes(search);
  });

  renderConsultations(filtered);
};

// ─── Switch View (Standard vs Secrétaire) ───

window.switchView = function(view) {
  currentView = view;
  document.getElementById("tab-standard").classList.toggle("active", view === "standard");
  document.getElementById("tab-secretaire").classList.toggle("active", view === "secretaire");
  
  const titleEl = document.getElementById("section-title-text");
  if (view === "secretaire") {
    titleEl.textContent = "Vue Secrétaire (Données filtrées vue_secretaire)";
  } else {
    titleEl.textContent = "Prochains rendez-vous (Vue Standard)";
  }

  loadConsultations();
};

// ─── Load consultations ───

async function loadConsultations() {
  app.innerHTML = '<div class="loading">Chargement des données…</div>';
  try {
    const endpoint = currentView === "secretaire" ? `${API}/secretaire/consultations` : `${API}/consultations`;
    const res = await fetch(endpoint);
    allConsultations = await res.json();

    const now = new Date();
    upcoming = allConsultations.filter(c => c.statut === "planifié" && new Date(c.date_heure) >= now);

    // Si pas de RDV futurs, afficher tout de même les consultations disponibles
    if (upcoming.length === 0) {
      upcoming = allConsultations.slice(0, 30);
    }

    updateStatBoxes();
    visibleCount = 5;
    filterConsultations();
  } catch (err) {
    app.innerHTML = '<div class="empty"><p>Erreur de connexion au serveur</p></div>';
    console.error(err);
  }
}

// ─── Cancel ───

window.annuler = async function (id) {
  if (!confirm("Voulez-vous vraiment annuler cette consultation ?")) return;
  try {
    const res = await fetch(`${API}/consultations/${id}/annuler`, { method: "POST" });
    if (res.ok) {
      showToast("✓ Consultation annulée avec succès");
      loadConsultations();
      loadStats();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de l'annulation");
    }
  } catch (err) {
    alert("Erreur de connexion au serveur");
  }
};

// ─── Load stats (Personne 2) ───

async function loadStats() {
  const container = document.getElementById("stats-container");
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();

    if (data.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:0.82rem">Aucune donnée</p>';
      return;
    }

    const sorted = data.sort((a, b) => b.rdv_ce_mois - a.rdv_ce_mois);

    container.innerHTML = sorted
      .map((m, i) => {
        const rank = m.rdv_ce_mois > 0 ? (i < 3 ? `rank-${i + 1}` : "rank-other") : "rank-other";
        const medal = i === 0 && m.rdv_ce_mois > 0 ? "🥇" : i === 1 && m.rdv_ce_mois > 0 ? "🥈" : i === 2 && m.rdv_ce_mois > 0 ? "🥉" : "";
        const ini = m.nom.replace(/^Dr\.?\s*/i, "").substring(0, 2).toUpperCase();
        return `
      <div class="doc-chip">
        <div class="doc-avatar ${rank}">${medal || ini}</div>
        <div class="doc-info">
          <div class="doc-name">${docName(m.nom)}</div>
          <div class="doc-spec">${m.specialite || ""}</div>
        </div>
        <span class="doc-count ${m.rdv_ce_mois > 0 ? "active" : "zero"}">${m.rdv_ce_mois}</span>
      </div>`;
      })
      .join("");
  } catch (err) {
    container.innerHTML = '<p style="color:#ef4444;font-size:0.82rem">Erreur</p>';
  }
}

// ─── Modals & Form Logic (Personne 3 : Triggers & RBAC) ───

window.openRdvModal = async function() {
  document.getElementById("rdvModal").classList.add("open");
  await loadSelectOptions();
};

window.closeRdvModal = function() {
  document.getElementById("rdvModal").classList.remove("open");
};

async function loadSelectOptions() {
  const patSelect = document.getElementById("rdv-patient");
  const docSelect = document.getElementById("rdv-medecin");

  try {
    if (patientsList.length === 0) {
      const resP = await fetch(`${API}/patients`);
      patientsList = await resP.json();
      patSelect.innerHTML = patientsList.map(p => `<option value="${p.id}">${p.prenom} ${p.nom}</option>`).join("");
    }
    if (medecinsList.length === 0) {
      const resM = await fetch(`${API}/medecins`);
      medecinsList = await resM.json();
      docSelect.innerHTML = medecinsList.map(m => `<option value="${m.id}">${docName(m.nom)} (${m.specialite})</option>`).join("");
    }
  } catch (e) {
    console.error("Erreur chargement listes", e);
  }

  // Pré-remplir date par défaut (demain 10h)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const isoLocal = tomorrow.toISOString().slice(0, 16);
  if (!document.getElementById("rdv-date").value) {
    document.getElementById("rdv-date").value = isoLocal;
  }
}

window.prefillConflictTest = function() {
  // Sélectionner Dr. House (id 1) et date occupée (2026-10-12 09:00)
  const docSelect = document.getElementById("rdv-medecin");
  const dateInput = document.getElementById("rdv-date");
  docSelect.value = "1";
  dateInput.value = "2026-10-12T09:00";
  showToast("⚡ Créneau pré-rempli sur un rendez-vous déjà existant (test du Trigger anti_surreservation)");
};

window.handleCreateRdv = async function(event) {
  event.preventDefault();
  const patient_id = parseInt(document.getElementById("rdv-patient").value);
  const medecin_id = parseInt(document.getElementById("rdv-medecin").value);
  const rawDate = document.getElementById("rdv-date").value;
  const date_heure = rawDate.replace("T", " ") + ":00";

  try {
    const res = await fetch(`${API}/consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id, medecin_id, date_heure })
    });

    const data = await res.json();
    if (res.ok) {
      showToast("✓ Rendez-vous programmé avec succès !");
      closeRdvModal();
      loadConsultations();
      loadStats();
    } else {
      // Afficher le message d'exception levé par le trigger PostgreSQL
      alert(`🛡️ Rejeté par la Base de Données (Trigger anti_surreservation) :\n\n${data.error}`);
    }
  } catch (err) {
    alert("Erreur de communication avec le serveur");
  }
};

window.openRbacModal = async function() {
  const modal = document.getElementById("rbacModal");
  const body = document.getElementById("rbacModalBody");
  modal.classList.add("open");
  body.innerHTML = '<div class="loading">Exécution des requêtes SQL de vérification RBAC…</div>';

  try {
    const res = await fetch(`${API}/securite/test-rbac`);
    const data = await res.json();

    body.innerHTML = `
      <div style="font-size:0.8rem;color:#64748b;margin-bottom:0.75rem;">
        Connexion test exécutée sous l'utilisateur PostgreSQL : <strong>${data.utilisateur}</strong> (Rôle : <code>${data.role}</code>)
      </div>
      ${data.tests.map(t => `
        <div class="rbac-card ${t.autorise ? 'success' : 'blocked'}">
          <div class="rbac-title">
            ${t.autorise ? '✅ ACCÈS AUTORISÉ' : '🛑 ACCÈS BLOQUÉ (SÉCURITÉ CONFIRMÉE)'} — <code>${t.cible}</code>
          </div>
          <div class="rbac-desc">${t.resultat}</div>
        </div>
      `).join("")}
      <div style="font-size:0.72rem;color:#64748b;line-height:1.4;margin-top:0.75rem;">
        💡 <em>Le rôle secrétaire dispose du droit de lecture sur la vue dédiée <code>vue_secretaire</code> (GRANT SELECT), mais les accès directs aux tables sensibles comme <code>patients</code> sont rigoureusement interdits.</em>
      </div>
    `;
  } catch (err) {
    body.innerHTML = '<div class="empty"><p>Erreur lors du test RBAC</p></div>';
  }
};

window.closeRbacModal = function() {
  document.getElementById("rbacModal").classList.remove("open");
};

// ─── Init ───
loadConsultations();
loadStats();

