const API = "http://localhost:3000/api";
const app = document.getElementById("app");
const toast = document.getElementById("toast");

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

// ─── Charger les consultations ───
async function loadConsultations() {
  app.innerHTML = '<div class="loading">Chargement…</div>';

  try {
    const res = await fetch(`${API}/consultations`);
    const data = await res.json();

    if (data.length === 0) {
      app.innerHTML = `
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>Aucune consultation à venir</p>
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
          <span class="badge">${c.statut}</span>
        </div>
        <button class="btn-cancel" onclick="annuler(${c.id})">Annuler</button>
      </div>`
      )
      .join("");
  } catch (err) {
    app.innerHTML = '<div class="empty">Erreur de connexion au serveur</div>';
    console.error(err);
  }
}

// ─── Annuler une consultation ───
async function annuler(id) {
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

// ─── Init ───
loadConsultations();
