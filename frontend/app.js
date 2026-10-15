const API = 'http://localhost:3000/api';
let data = [], view = 'main';

const PSG = {
    'Dembélé':     { num:10, pos:'ATT', rating:88 },
    'Hakimi':      { num:2,  pos:'DEF', rating:86 },
    'Donnarumma':  { num:99, pos:'GK',  rating:89 },
    'Marquinhos':  { num:5,  pos:'DEF', rating:87 },
    'Vitinha':     { num:17, pos:'MIL', rating:85 },
    'Zaïre-Emery': { num:33, pos:'MIL', rating:83 },
    'Barcola':     { num:29, pos:'ATT', rating:82 },
    'Kolo Muani':  { num:23, pos:'ATT', rating:84 }
};

document.addEventListener('DOMContentLoaded', () => {
    load();
    initStadium();
    initParticles();
    initScrollReveal();
});

async function load() {
    try {
        const r = await fetch(API + '/consultations');
        data = await r.json();
        renderTable(data);
        loadStats();
        loadPlayers();
    } catch(e) { console.error(e); }
}

function renderTable(items) {
    if (!items) return;
    const tbody = document.getElementById('tbody');
    const counter = document.getElementById('consult-count');
    if (counter) counter.textContent = '(' + items.length + ')';
    tbody.innerHTML = items.map(c => {
        const st = c.statut || 'planifié';
        const cls = st.includes('annul') ? 'badge-annule' : st.includes('termin') ? 'badge-termine' : 'badge-planifie';
        const d = new Date(c.date_consultation).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
        const patient = c.patient_nom ? (c.patient_prenom||'') + ' ' + c.patient_nom : (c.patient||'--');
        const medecin = c.medecin_nom || c.medecin || '--';
        const lieu = c.cabinet_nom || c.lieu || '--';
        const canCancel = st.includes('planifi');
        return '<tr>' +
            '<td>' + patient.trim() + '</td>' +
            '<td>' + medecin + '</td>' +
            '<td>' + d + '</td>' +
            '<td>' + lieu + '</td>' +
            '<td><span class="badge ' + cls + '">' + st + '</span></td>' +
            '<td>' + (canCancel ? '<button class="btn-annuler" onclick="annuler(' + c.id + ')">Annuler</button>' : '') + '</td>' +
        '</tr>';
    }).join('');
}

async function loadStats() {
    try {
        const r = await fetch(API + '/stats');
        const stats = await r.json();
        const total = data.length;
        const planifie = data.filter(c => (c.statut||'').includes('planifi')).length;
        const annule = data.filter(c => (c.statut||'').includes('annul')).length;
        animateNumber('st-total', total);
        animateNumber('st-planifie', planifie);
        animateNumber('st-annule', annule);
        if (stats && stats.length) {
            const sorted = stats.slice().sort((a,b) => (b.nombre_rdv||b.count||0) - (a.nombre_rdv||a.count||0));
            const top3 = sorted.slice(0, 3);
            const podium = document.getElementById('podium');
            const order = [1, 0, 2];
            podium.innerHTML = order.filter(i => top3[i]).map(i => {
                const s = top3[i];
                const rank = i + 1;
                const name = s.medecin_nom || s.medecin || s.nom || '--';
                const count = s.nombre_rdv || s.count || 0;
                return '<div class="podium-item podium-' + rank + '">' +
                    '<div class="podium-rank">' + rank + '</div>' +
                    '<div class="podium-name">' + name + '</div>' +
                    '<div class="podium-count">' + count + '</div>' +
                    '<div class="podium-label">consultations</div>' +
                '</div>';
            }).join('');
        }
    } catch(e) { console.error(e); }
}

async function loadPlayers() {
    try {
        const r = await fetch(API + '/patients');
        const patients = await r.json();
        const grid = document.getElementById('players-grid');
        grid.innerHTML = patients.map(p => {
            const nom = p.nom || '';
            const prenom = p.prenom || '';
            const meta = PSG[nom] || { num:'?', pos:'JOU', rating:80 };
            const initials = (prenom[0]||'') + (nom[0]||'');
            return '<div class="fifa-card" onmousemove="tilt(event,this)" onmouseleave="untilt(this)">' +
                '<div class="card-number">' + meta.num + '</div>' +
                '<div class="card-pos pos-' + meta.pos + '">' + meta.pos + '</div>' +
                '<div class="card-avatar">' + initials + '</div>' +
                '<div class="card-name">' + nom + '</div>' +
                '<div class="card-fullname">' + prenom + ' ' + nom + '</div>' +
                '<div class="card-rating">' +
                    '<div class="rating-num">' + meta.rating + '</div>' +
                    '<div class="rating-label">OVR</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch(e) { console.error(e); }
}

function tilt(e, el) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = 'translateY(-8px) rotateY(' + (x*15) + 'deg) rotateX(' + (-y*15) + 'deg)';
}
function untilt(el) { el.style.transform = ''; }

function animateNumber(id, target) {
    var el = document.getElementById(id);
    if (!el) return;
    var current = 0;
    var step = Math.max(1, Math.floor(target / 40));
    var iv = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(iv); }
        el.textContent = current;
    }, 30);
}

async function annuler(id) {
    try {
        var r = await fetch(API + '/consultations/' + id + '/annuler', { method:'POST' });
        var j = await r.json();
        if (r.ok) { toast('Consultation annulee -- procedure annuler_rdv executee', 'success'); load(); }
        else toast(j.error || 'Erreur', 'error');
    } catch(e) { toast('Erreur reseau', 'error'); }
}

async function switchView(v) {
    view = v;
    document.querySelectorAll('.nav-tabs button').forEach(function(b,i) {
        b.classList.toggle('active', (v==='main'&&i===0)||(v==='secretaire'&&i===1));
    });
    if (v === 'secretaire') {
        try {
            var r = await fetch(API + '/secretaire/consultations');
            var d = await r.json();
            renderTable(d);
        } catch(e) { toast('Erreur chargement vue secretaire', 'error'); }
    } else {
        renderTable(data);
    }
}

function openRdvModal() {
    document.getElementById('modal-rdv').classList.add('open');
    loadModalSelects();
}
function openRbacModal() {
    document.getElementById('modal-rbac').classList.add('open');
    testRbac();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function loadModalSelects() {
    try {
        var res = await Promise.all([fetch(API+'/patients'), fetch(API+'/medecins')]);
        var arr = await Promise.all(res.map(function(r){return r.json()}));
        document.getElementById('sel-patient').innerHTML = arr[0].map(function(p){return '<option value="'+p.id+'">'+p.prenom+' '+p.nom+'</option>'}).join('');
        document.getElementById('sel-medecin').innerHTML = arr[1].map(function(m){return '<option value="'+m.id+'">'+m.prenom+' '+m.nom+'</option>'}).join('');
    } catch(e) {}
}

function prefillConflict() {
    document.getElementById('sel-medecin').value = 1;
    document.getElementById('inp-date').value = '2026-10-15T09:00';
    toast('Pre-rempli pour tester anti_surreservation', 'success');
}

async function createRdv() {
    var body = {
        patient_id: document.getElementById('sel-patient').value,
        medecin_id: document.getElementById('sel-medecin').value,
        date_consultation: document.getElementById('inp-date').value
    };
    try {
        var r = await fetch(API+'/consultations', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        var j = await r.json();
        if (r.ok) { toast('Consultation creee avec succes', 'success'); closeModal('modal-rdv'); load(); }
        else toast(j.error || j.detail || 'Erreur -- trigger anti_surreservation ?', 'error');
    } catch(e) { toast('Erreur reseau', 'error'); }
}

async function testRbac() {
    try {
        var r = await fetch(API+'/securite/test-rbac');
        var d = await r.json();
        var c = document.getElementById('rbac-content');
        if (Array.isArray(d)) {
            c.innerHTML = d.map(function(t){
                var ok = t.acces||t.granted||t.success;
                return '<div class="rbac-row"><span>'+(t.test||t.description||t.action)+'</span><span class="'+(ok?'rbac-ok':'rbac-no')+'">'+(ok?'Autorise':'Refuse')+'</span></div>';
            }).join('');
        } else {
            c.innerHTML = '<pre style="font-size:12px;color:var(--gray);white-space:pre-wrap">'+JSON.stringify(d,null,2)+'</pre>';
        }
    } catch(e) { document.getElementById('rbac-content').innerHTML = '<p style="color:var(--gray)">Erreur de chargement</p>'; }
}

function toast(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast toast-' + type + ' show';
    setTimeout(function(){ el.classList.remove('show'); }, 3500);
}

/* ══════════════════════════════════════════
   THREE.JS — STADE 3D
   ══════════════════════════════════════════ */
function initStadium() {
    var canvas = document.getElementById('stadium-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var w = canvas.clientWidth, h = canvas.clientHeight;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070d1a);
    scene.fog = new THREE.FogExp2(0x070d1a, 0.004);

    var camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 500);
    var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    /* --- Materials --- */
    var fieldMat  = new THREE.MeshStandardMaterial({ color:0x1a7a1a, roughness:0.8 });
    var blueMat   = new THREE.MeshStandardMaterial({ color:0x003366 });
    var redMat    = new THREE.MeshStandardMaterial({ color:0xaa2020 });
    var darkBlue  = new THREE.MeshStandardMaterial({ color:0x002244 });
    var darkRed   = new THREE.MeshStandardMaterial({ color:0x881818 });
    var grayMat   = new THREE.MeshStandardMaterial({ color:0x555555 });
    var whiteMat  = new THREE.MeshBasicMaterial({ color:0xffffff, side:THREE.DoubleSide });
    var glowMat   = new THREE.MeshStandardMaterial({ color:0xffffcc, emissive:0xffffaa, emissiveIntensity:0.8 });

    /* --- Field --- */
    var field = new THREE.Mesh(new THREE.PlaneGeometry(105, 68), fieldMat);
    field.rotation.x = -Math.PI/2;
    field.receiveShadow = true;
    scene.add(field);

    /* --- Field markings --- */
    var cl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 68), whiteMat);
    cl.rotation.x = -Math.PI/2; cl.position.y = 0.05;
    scene.add(cl);

    var ring = new THREE.Mesh(new THREE.RingGeometry(8.5, 9, 64), whiteMat);
    ring.rotation.x = -Math.PI/2; ring.position.y = 0.05;
    scene.add(ring);

    /* penalty areas */
    var pa1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 40), whiteMat);
    pa1.rotation.x=-Math.PI/2; pa1.position.set(-36, 0.05, 0); scene.add(pa1);
    var pa2 = pa1.clone(); pa2.position.set(36, 0.05, 0); scene.add(pa2);
    var pa3 = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 0.3), whiteMat);
    pa3.rotation.x=-Math.PI/2; pa3.position.set(-44.25, 0.05, 20); scene.add(pa3);
    var pa4 = pa3.clone(); pa4.position.set(-44.25, 0.05, -20); scene.add(pa4);
    var pa5 = pa3.clone(); pa5.position.set(44.25, 0.05, 20); scene.add(pa5);
    var pa6 = pa3.clone(); pa6.position.set(44.25, 0.05, -20); scene.add(pa6);

    /* --- Stands (lower tier) --- */
    var sn = new THREE.Mesh(new THREE.BoxGeometry(115, 16, 20), blueMat);
    sn.position.set(0, 8, -44); scene.add(sn);
    var ss = new THREE.Mesh(new THREE.BoxGeometry(115, 16, 20), redMat);
    ss.position.set(0, 8, 44); scene.add(ss);
    var sw = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 108), blueMat);
    sw.position.set(-62.5, 7, 0); scene.add(sw);
    var se = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 108), redMat);
    se.position.set(62.5, 7, 0); scene.add(se);

    /* --- Stands (upper tier) --- */
    var un = new THREE.Mesh(new THREE.BoxGeometry(112, 10, 14), darkBlue);
    un.position.set(0, 21, -47); scene.add(un);
    var us = new THREE.Mesh(new THREE.BoxGeometry(112, 10, 14), darkRed);
    us.position.set(0, 21, 47); scene.add(us);
    var uw = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 100), darkBlue);
    uw.position.set(-65, 18.5, 0); scene.add(uw);
    var ue = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 100), darkRed);
    ue.position.set(65, 18.5, 0); scene.add(ue);

    /* --- Floodlights --- */
    var floodPositions = [[-60,-48],[60,-48],[-60,48],[60,48]];
    floodPositions.forEach(function(pos) {
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 45), grayMat);
        pole.position.set(pos[0], 22.5, pos[1]);
        scene.add(pole);
        var fix = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 4), glowMat);
        fix.position.set(pos[0], 46, pos[1]);
        scene.add(fix);
        var sl = new THREE.SpotLight(0xffeedd, 0.5, 200, Math.PI/4, 0.5);
        sl.position.set(pos[0], 45, pos[1]);
        sl.target = field;
        scene.add(sl);
    });

    /* --- Lighting --- */
    scene.add(new THREE.AmbientLight(0x303050, 0.4));
    scene.add(new THREE.HemisphereLight(0x4060a0, 0x101020, 0.4));

    /* --- Stars --- */
    var starGeo = new THREE.BufferGeometry();
    var starPos = [];
    for (var i = 0; i < 600; i++) {
        starPos.push((Math.random()-0.5)*500, Math.random()*120+40, (Math.random()-0.5)*500);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color:0xffffff, size:0.35 })));

    /* --- Camera orbit --- */
    var angle = 0;
    camera.position.set(90, 45, 90);
    camera.lookAt(0, 0, 0);

    function animate() {
        requestAnimationFrame(animate);
        angle += 0.0012;
        camera.position.x = 110 * Math.cos(angle);
        camera.position.z = 110 * Math.sin(angle);
        camera.position.y = 38 + 14 * Math.sin(angle * 0.35);
        camera.lookAt(0, 3, 0);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function() {
        var nw = canvas.clientWidth, nh = canvas.clientHeight;
        camera.aspect = nw/nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
    });
}

/* ══════════════════════════════════════════
   PARTICLES (golden floating dots)
   ══════════════════════════════════════════ */
function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h;
    var particles = [];

    function resize() {
        w = canvas.width = canvas.clientWidth;
        h = canvas.height = canvas.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 50; i++) {
        particles.push({
            x: Math.random()*w, y: Math.random()*h,
            vx: (Math.random()-0.5)*0.3, vy: -Math.random()*0.4 - 0.1,
            r: Math.random()*2 + 0.5,
            a: Math.random()*0.35 + 0.08
        });
    }

    function draw() {
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(212,168,67,' + p.a + ')';
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
            if (p.y < -10) { p.y = h+10; p.x = Math.random()*w; }
            if (p.x < -10 || p.x > w+10) p.x = Math.random()*w;
        }
    }
    draw();
}

/* ══════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════ */
function initScrollReveal() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}
