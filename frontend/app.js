const API = "http://localhost:3000/api";
const app = document.getElementById("app");
const toast = document.getElementById("toast");

let allConsultations = [];
let upcoming = [];
let visibleCount = 5;

// ─── Helpers ───

function formatDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function initials(prenom, nom) {
  return (prenom[0] + nom[0]).toUpperCase();
}

function docName(nom) {
  return nom.startsWith("Dr") ? nom : `Dr. ${nom}`;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
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
      return `
    <div class="card" style="animation-delay:${i * 0.06}s">
      <div class="card-accent"></div>
      <div class="card-body">
        <div class="card-left">
          <div class="card-avatar">${ini}</div>
          <div class="card-info">
            <span class="card-patient">${c.patient_prenom} ${c.patient_nom}</span>
            <span class="card-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${date} · ${time}
              <span class="card-tag">${docName(c.medecin_nom)} · ${c.specialite}</span>
            </span>
          </div>
        </div>
        <button class="btn-cancel" onclick="annuler(${c.id})">Annuler</button>
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
    return (
      c.patient_nom.toLowerCase().includes(search) ||
      c.patient_prenom.toLowerCase().includes(search) ||
      c.medecin_nom.toLowerCase().includes(search) ||
      c.specialite.toLowerCase().includes(search)
    );
  });

  renderConsultations(filtered);
};

// ─── Load consultations ───

async function loadConsultations() {
  app.innerHTML = '<div class="loading">Chargement…</div>';
  try {
    const res = await fetch(`${API}/consultations`);
    allConsultations = await res.json();

    const now = new Date();
    upcoming = allConsultations.filter(c => c.statut === "planifié" && new Date(c.date_heure) >= now);

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
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de l'annulation");
    }
  } catch (err) {
    alert("Erreur de connexion au serveur");
  }
};

// ─── Load stats ───

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

// ─── Init ───
loadConsultations();
loadStats();
