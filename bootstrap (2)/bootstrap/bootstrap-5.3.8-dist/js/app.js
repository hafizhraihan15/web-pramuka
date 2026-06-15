/* ============================================================
   app.js — Main Application Logic (FINAL v3)
   Supabase Auth + API Integration
   ============================================================ */

// ==================== CONFIG ====================
// Sesuaikan dengan Supabase project kamu
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
const API_BASE      = `${SUPABASE_URL}/rest/v1`;

// ==================== SUPABASE REST HELPERS ====================
async function sbGet(table, params = '') {
  const res = await fetch(`${API_BASE}/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${API_BASE}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ==================== LOADER ====================
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader-screen');
    if (loader) {
      loader.classList.add('hidden');
      startHeroAnimations();
      startCounters();
    }
  }, 1800);
});

// ==================== NAVBAR SCROLL ====================
const navbar = document.getElementById('mainNavbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
  });
}

function updateActiveNav() {
  const sections = ['beranda', 'tentang', 'program', 'gallery', 'daftar', 'kontak'];
  const scrollPos = window.scrollY + 100;

  sections.forEach(id => {
    const section = document.getElementById(id);
    const navLink = document.getElementById('nav-' + id);
    if (!section || !navLink) return;

    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (scrollPos >= top && scrollPos < bottom) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      navLink.classList.add('active');
    }
  });
}

// ==================== TWINKLING STARS ====================
function initParticles() {
  const container = document.getElementById('twinkle-stars');
  if (!container) return;

  const STAR_COUNT = 200;

  // Color palette: white, gold, light-blue
  const colors = [
    'rgba(255,255,255,',
    'rgba(255,215,0,',
    'rgba(255,235,100,',
    'rgba(180,220,255,',
  ];

  // Blink animation types (varied durations + delay)
  const blinkDurations = [1.2, 1.6, 2.0, 2.5, 3.0, 1.8, 0.9, 2.8];

  container.innerHTML = '';

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('span');
    star.className = 'twinkle-star';

    const size    = Math.random() * 2.8 + 0.5;          // 0.5 – 3.3px
    const x       = Math.random() * 100;                  // 0–100%
    const y       = Math.random() * 100;                  // 0–100%
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const opacity = (Math.random() * 0.5 + 0.4).toFixed(2); // 0.4–0.9
    const dur     = blinkDurations[Math.floor(Math.random() * blinkDurations.length)];
    const delay   = (Math.random() * 5).toFixed(2);      // 0–5s stagger
    // ~25% of stars get a soft glow
    const glow    = Math.random() > 0.75
      ? `0 0 ${(size * 3).toFixed(1)}px ${color}0.85), 0 0 ${(size * 6).toFixed(1)}px ${color}0.35)`
      : 'none';

    star.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color}${opacity});
      box-shadow: ${glow};
      animation: twinkle-blink ${dur}s ease-in-out ${delay}s infinite alternate;
      pointer-events: none;
    `;
    container.appendChild(star);
  }

  // Inject keyframes once
  if (!document.getElementById('twinkle-style')) {
    const style = document.createElement('style');
    style.id = 'twinkle-style';
    style.textContent = `
      #twinkle-stars {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        pointer-events: none;
      }
      @keyframes twinkle-blink {
        0%   { opacity: 0.08; transform: scale(0.6); }
        40%  { opacity: 1;    transform: scale(1.15); }
        70%  { opacity: 0.6;  transform: scale(0.9); }
        100% { opacity: 0.08; transform: scale(0.65); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==================== TYPING EFFECT ====================
function initTyping() {
  const el = document.getElementById('typed-output');
  if (!el) return;

  const texts = [
    'Membentuk generasi berkarakter...',
    'Berlatih, Berprestasi, Berbakti...',
    'Pramuka: Petualangan sejati!',
    'Bersama membangun negeri...',
    'Sedia — Waspada — Kesatria 🏕️',
  ];
  let ti = 0, ci = 0, deleting = false;

  function type() {
    const current = texts[ti];
    if (!deleting) {
      el.textContent = current.substring(0, ci + 1);
      ci++;
      if (ci === current.length) {
        deleting = true;
        setTimeout(type, 2200);
        return;
      }
    } else {
      el.textContent = current.substring(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        ti = (ti + 1) % texts.length;
      }
    }
    setTimeout(type, deleting ? 38 : 78);
  }
  type();
}

// ==================== COUNTER ANIMATION ====================
function startCounters() {
  const counters = document.querySelectorAll('[data-target]');
  counters.forEach(counter => {
    const target   = +counter.getAttribute('data-target');
    const duration = 2200;
    const step     = target / (duration / 16);
    let current    = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        counter.textContent = target + (target > 50 ? '+' : '');
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current);
      }
    }, 16);
  });
}

// ==================== SCROLL REVEAL ====================
function initScrollReveal() {
  const opts = { threshold: 0.1, rootMargin: '0px 0px -60px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 90);
        observer.unobserve(entry.target);
      }
    });
  }, opts);

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

// ==================== PROGRAM SECTION ====================
let allPrograms = [];

async function loadPrograms() {
  const grid = document.getElementById('program-grid');
  if (!grid) return;

  try {
    const data = await sbGet('programs', 'is_active=eq.true&order=sort_order.asc');
    if (data && data.length > 0) {
      allPrograms = data;
      renderPrograms(allPrograms);
    } else {
      allPrograms = getDefaultPrograms();
      renderPrograms(allPrograms);
    }
  } catch(e) {
    allPrograms = getDefaultPrograms();
    renderPrograms(allPrograms);
  }
}

function getDefaultPrograms() {
  return [
    { id:1, icon:'🤝', title:'Bakti Sosial',   category:'Rutin',    description:'Aksi nyata membantu masyarakat sekitar sebagai bentuk pengamalan Dasa Darma kedua. Dilaksanakan setiap bulan.',   schedule:'Setiap Bulan' },
    { id:2, icon:'🏕️', title:'Latihan Rutin',  category:'Rutin',    description:'Pengembangan teknik kepramukaan (scout skill) setiap akhir pekan, mencakup PPGD, baris berbaris, dan survival skill.', schedule:'Setiap Sabtu' },
    { id:3, icon:'🔥', title:'Kemah Tahunan',   category:'Tahunan',  description:'Ajang mempererat persaudaraan dan melatih kemandirian di alam terbuka. Diikuti seluruh anggota aktif.',             schedule:'Setiap Tahun' },
    { id:4, icon:'⚜️', title:'Pramuka Garuda', category:'Prestasi', description:'Program pencapaian tingkatan tertinggi bagi anggota Pramuka yang berprestasi dan berkomitmen tinggi.',            schedule:'Berkelanjutan' },
    { id:5, icon:'🏆', title:'Lomba Tingkat',   category:'Prestasi', description:'Berpartisipasi dalam berbagai ajang perlombaan antar pangkalan, dari tingkat ranting hingga nasional.',             schedule:'Menyesuaikan' },
    { id:6, icon:'🌍', title:'Jambore',          category:'Tahunan',  description:'Pertemuan pramuka penggalang dalam bentuk perkemahan besar bersama gugus depan lain se-Indonesia.',               schedule:'2 Tahunan' },
  ];
}

function renderPrograms(data) {
  const grid = document.getElementById('program-grid');
  if (!grid) return;

  if (data.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.5);padding:80px 0;"><div style="font-size:3.5rem;margin-bottom:16px;">📋</div><p>Belum ada program tersedia.</p></div>';
    return;
  }

  grid.innerHTML = data.map((p, idx) => `
    <div class="program-card reveal" data-category="${p.category}" onclick="showProgramDetail(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="animation-delay:${idx * 80}ms">
      <span class="program-icon">${p.icon || '🏕️'}</span>
      <span class="program-category">${p.category}</span>
      <h4>${p.title}</h4>
      <p>${p.description}</p>
      ${p.schedule ? `<div class="program-schedule">📅 ${p.schedule}</div>` : ''}
    </div>
  `).join('');

  initScrollReveal();
}

function showProgramDetail(program) {
  document.getElementById('programModalTitle').textContent = program.title;
  document.getElementById('modal-prog-icon').textContent   = program.icon || '🏕️';
  document.getElementById('modal-prog-cat').textContent    = program.category;
  document.getElementById('modal-prog-desc').textContent   = program.description;
  document.getElementById('modal-prog-schedule').innerHTML = program.schedule ? `📅 Jadwal: ${program.schedule}` : '';
  const modal = new bootstrap.Modal(document.getElementById('programModal'));
  modal.show();
}

// Program Filter
document.querySelectorAll('.prog-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.prog-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter   = btn.getAttribute('data-filter');
    const filtered = filter === 'all' ? allPrograms : allPrograms.filter(p => p.category === filter);
    renderPrograms(filtered);
  });
});

// ==================== FORM PENDAFTARAN ====================
const formDaftar = document.getElementById('form-daftar');
if (formDaftar) {
  formDaftar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-daftar');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Mengirim...';

    const body = {
      name:       document.getElementById('daftar-name').value,
      class:      document.getElementById('daftar-class').value,
      phone:      document.getElementById('daftar-phone')?.value || '',
      address:    document.getElementById('daftar-address')?.value || '',
      motivation: document.getElementById('daftar-motivation')?.value || '',
      status:     'pending',
    };

    try {
      await sbPost('members', body);
      showToast('✅ Pendaftaran berhasil! Kami akan menghubungi kamu segera.', 'success');
      formDaftar.reset();
    } catch(err) {
      showToast(`❌ Gagal mengirim: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '📝 Kirim Pendaftaran';
    }
  });
}

// ==================== FORM KONTAK ====================
const formKontak = document.getElementById('form-kontak');
if (formKontak) {
  formKontak.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-kontak');
    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    const body = {
      name:    document.getElementById('kontak-name').value,
      email:   document.getElementById('kontak-email').value,
      subject: document.getElementById('kontak-subject')?.value || '',
      message: document.getElementById('kontak-message').value,
    };

    try {
      await sbPost('messages', body);
      showToast('✅ Pesan terkirim! Kami akan membalas segera.', 'success');
      formKontak.reset();
    } catch(err) {
      showToast(`❌ Gagal mengirim pesan: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '📨 Kirim Pesan Sekarang';
    }
  });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-notif ${type}`;

  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  toast.innerHTML = `
    <span style="font-size:1.1rem;">${icons[type] || '📢'}</span>
    <span style="flex:1;">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu if open
      const collapse = document.getElementById('navbarNav');
      if (collapse?.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(collapse);
        if (bsCollapse) bsCollapse.hide();
      }
    }
  });
});

// ==================== START HERO ANIMATIONS ====================
function startHeroAnimations() {
  initParticles();
  initTyping();
}

// ==================== PENGUMUMAN / BERITA ====================
async function loadAnnouncements() {
  const grid  = document.getElementById('annc-grid');
  const empty = document.getElementById('annc-empty');
  if (!grid) return;

  try {
    const data = await sbGet('announcements', 'is_active=eq.true&order=created_at.desc&limit=6');

    if (!data || data.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    const now = Date.now();
    grid.innerHTML = data.map((a, idx) => {
      // Badge "BARU" jika kurang dari 7 hari
      const isNew   = (now - new Date(a.created_at).getTime()) < 7 * 24 * 3600 * 1000;
      const dateStr = new Date(a.created_at).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      const imgHtml = a.image_url
        ? `<div class="annc-img-wrap">
             <img src="${a.image_url}" alt="${a.title}" loading="lazy"
                  onerror="this.parentElement.innerHTML='<div class=\\'annc-img-placeholder\\'>📢</div>'" />
           </div>`
        : `<div class="annc-img-wrap">
             <div class="annc-img-placeholder">📢</div>
           </div>`;

      const linkHtml = a.link_url
        ? `<a href="${a.link_url}" target="_blank" rel="noopener" class="annc-link">
             📝 ${a.link_label || 'Daftar Sekarang'} →
           </a>`
        : '';

      return `
        <div class="annc-card reveal" style="animation-delay:${idx * 80}ms">
          ${imgHtml}
          ${isNew ? '<span class="annc-badge-new">🔴 Baru</span>' : ''}
          <div class="annc-body">
            <div class="annc-date">📅 ${dateStr}</div>
            <div class="annc-title">${a.title}</div>
            <div class="annc-content">${a.content}</div>
            ${linkHtml}
          </div>
        </div>
      `;
    }).join('');

    initScrollReveal();
  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray-400);">
      <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
      <p>Gagal memuat pengumuman.</p>
    </div>`;
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  loadPrograms();
  loadAnnouncements();
});
