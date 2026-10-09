const API = "http://localhost:3000/api";
const app = document.getElementById("app");
const toast = document.getElementById("toast");
let allConsultations = [];

// ─── Formater la date ───
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " à " + d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Afficher un toast ───
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ─── Rendu de la liste ───
function renderConsultations(data) {
  if (data.length === 0) {
    app.innerHTML = `
      <div class="empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>Aucune consultation trouvée</p>
      </div>`;
    return;
  }

  app.innerHTML = data
    .map(
      (c) => `
    <div class="card">
      <div class="card-info">
        <span class="card-date">${formatDate(c.date_heure)}</span>
        <span class="card-patient">${c.patient_prenom} ${c.patient_nom}</span>
        <span class="card-doctor">Dr. ${c.medecin_nom} — ${c.specialite}</span>
        <span class="badge" style="background: ${c.statut === 'annulé' ? '#fee2e2' : '#e0f2fe'}; color: ${c.statut === 'annulé' ? '#991b1b' : '#0369a1'}">${c.statut}</span>
      </div>
      ${c.statut !== 'annulé' ? `<button class="btn-cancel" onclick="annuler(${c.id})">Annuler</button>` : ''}
    </div>`
    )
    .join("");
}

// ─── Filtrer les consultations (Recherche + Statut) ───
window.filterConsultations = function() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  const filtered = allConsultations.filter(c => {
    // Vérifier la recherche (patient ou docteur)
    const matchSearch = 
      c.patient_nom.toLowerCase().includes(search) || 
      c.patient_prenom.toLowerCase().includes(search) ||
      c.medecin_nom.toLowerCase().includes(search);
    
    // Vérifier le statut
    const matchStatus = (status === "all") || (c.statut.toLowerCase() === status.toLowerCase());

    return matchSearch && matchStatus;
  });

  renderConsultations(filtered);
}

// ─── Charger les consultations ───
async function loadConsultations() {
  app.innerHTML = '<div class="loading">Chargement…</div>';

  try {
    const res = await fetch(`${API}/consultations`);
    allConsultations = await res.json();
    filterConsultations(); // Appeler la fonction pour appliquer les filtres directement
  } catch (err) {
    app.innerHTML = '<div class="empty">Erreur de connexion au serveur</div>';
    console.error(err);
  }
}

// ─── Annuler une consultation ───
window.annuler = async function(id) {
  if (!confirm("Voulez-vous vraiment annuler cette consultation ?")) return;

  try {
    const res = await fetch(`${API}/consultations/${id}/annuler`, {
      method: "POST",
    });
    const data = await res.json();

    if (res.ok) {
      showToast("✓ Consultation annulée");
      loadConsultations();
    } else {
      alert(data.error || "Erreur lors de l'annulation");
    }
  } catch (err) {
    alert("Erreur de connexion au serveur");
    console.error(err);
  }
}

// ─── Charger les stats (Personne 2) ───
async function loadStats() {
  const container = document.getElementById("stats-container");
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    
    if (data.length === 0) {
      container.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">Aucune donnée</p>';
      return;
    }

    container.innerHTML = data.map(m => `
      <div class="stat-row">
        <span>Dr. ${m.nom}</span>
        <strong>${m.rdv_ce_mois} RDV</strong>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 0.9rem;">Erreur de connexion</p>';
    console.error(err);
  }
}

// ─── Init ───
loadConsultations();
loadStats();
