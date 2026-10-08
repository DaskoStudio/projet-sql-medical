const API = "http://localhost:3000/api";
const app = document.getElementById("app");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-msg");

// ─── Formater la date ───
function formatDate(iso) {
  const d = new Date(iso);
  const options = { weekday: "long", day: "numeric", month: "long" };
  const dateStr = d.toLocaleDateString("fr-FR", options);
  const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `<span>${dateStr}</span> <span style="opacity: 0.6; margin: 0 4px">•</span> <span>${timeStr}</span>`;
}

// ─── Afficher un toast ───
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

// ─── Charger les consultations ───
async function loadConsultations() {
  app.innerHTML = `
    <div class="loading">
      <svg style="animation: spin 1s linear infinite; width: 32px; height: 32px; margin: 0 auto 1rem;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle>
        <path fill="var(--primary)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p>Synchronisation en cours…</p>
    </div>`;

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
        (c, i) => `
      <div class="card" style="animation-delay: ${i * 0.1}s">
        <div class="card-header">
          <div class="card-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${formatDate(c.date_heure)}
          </div>
          <span class="badge">${c.statut}</span>
        </div>
        
        <div class="card-body">
          <div class="card-patient">${c.patient_prenom} ${c.patient_nom}</div>
          <div class="card-doctor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Dr. ${c.medecin_nom} — ${c.specialite}
          </div>
        </div>

        <div class="card-footer">
          <button class="btn-cancel" onclick="annuler(${c.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Annuler le rendez-vous
          </button>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    app.innerHTML = `
      <div class="empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p style="color: var(--danger)">Erreur de connexion au serveur</p>
      </div>`;
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
      showToast("Consultation annulée avec succès");
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
