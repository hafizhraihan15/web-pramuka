/* ============================================================
   gallery.js — Gallery with Masonry + Lightbox + Filter (v3)
   Direct Supabase REST API integration
   ============================================================ */

// These will be set from app.js context (same page)
// Fallback values if loaded standalone
const _SUPABASE_URL  = (typeof SUPABASE_URL  !== 'undefined') ? SUPABASE_URL  : 'https://YOUR_PROJECT_ID.supabase.co';
const _SUPABASE_ANON = (typeof SUPABASE_ANON !== 'undefined') ? SUPABASE_ANON : 'YOUR_SUPABASE_ANON_KEY';

let galleryData        = [];
let filteredGallery    = [];
let currentLightboxIdx = 0;
let galleryPage        = 0;
const GALLERY_PAGE_SZ  = 12;

// ==================== FETCH GALLERY ====================
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  // Show skeleton
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="masonry-item" style="animation:none;">
      <div style="background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;height:${150 + Math.random()*120}px;border-radius:12px;"></div>
    </div>
  `).join('');

  try {
    const res = await fetch(
      `${_SUPABASE_URL}/rest/v1/gallery?order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': _SUPABASE_ANON,
          'Authorization': `Bearer ${_SUPABASE_ANON}`,
        }
      }
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    if (data && data.length > 0) {
      galleryData = data;
    } else {
      galleryData = getSampleGallery();
    }
  } catch(e) {
    galleryData = getSampleGallery();
  }

  filteredGallery = [...galleryData];
  galleryPage = 0;
  renderGalleryPage(true);
}

function getSampleGallery() {
  // Fallback sample using local images
  return [
    { id:'1', title:'Latihan Mingguan',         category:'Latihan',     image_url:'img/foto1.jpeg', description:'Sesi latihan baris berbaris dan skill pramuka' },
    { id:'2', title:'Perkemahan Sabtu Minggu',  category:'Kemah',       image_url:'img/foto2.jpeg', description:'PERSAMI di alam terbuka' },
    { id:'3', title:'Bakti Masyarakat',         category:'Bakti Sosial',image_url:'img/foto3.jpeg', description:'Kegiatan sosial bersama warga' },
    { id:'4', title:'Lomba Tingkat IV',         category:'Lomba',       image_url:'img/foto1.jpeg', description:'Juara 1 Lomba Tingkat kabupaten' },
    { id:'5', title:'Upacara Pelantikan',       category:'Acara',       image_url:'img/foto2.jpeg', description:'Pelantikan Pramuka Penggalang Ramu' },
    { id:'6', title:'Kemah Bhakti Nasional',    category:'Kemah',       image_url:'img/foto3.jpeg', description:'Kegiatan kemah antar-pangkalan' },
  ];
}

// ==================== RENDER GALLERY PAGE ====================
function renderGalleryPage(reset = false) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const start = galleryPage * GALLERY_PAGE_SZ;
  const items = filteredGallery.slice(start, start + GALLERY_PAGE_SZ);

  if (reset) grid.innerHTML = '';

  if (filteredGallery.length === 0) {
    grid.innerHTML = `
      <div class="gallery-empty" style="grid-column:1/-1;">
        <div class="icon">🖼️</div>
        <p>Belum ada foto di kategori ini.</p>
      </div>
    `;
    document.getElementById('gallery-load-more-wrap')?.style.setProperty('display','none');
    return;
  }

  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className  = 'masonry-item';
    el.style.animationDelay = `${i * 60}ms`;
    el.dataset.category = item.category;
    el.dataset.idx = filteredGallery.indexOf(item);

    el.innerHTML = `
      <img
        src="${item.image_url}"
        alt="${item.title}"
        loading="lazy"
        onerror="this.src='img/foto1.jpeg'"
      />
      <div class="masonry-overlay">
        <div class="masonry-title">${item.title}</div>
        <div class="masonry-cat">${item.category}</div>
      </div>
      <div class="masonry-zoom">🔍</div>
    `;

    el.addEventListener('click', () => {
      openLightbox(+el.dataset.idx);
    });

    grid.appendChild(el);
  });

  // Load more button
  const loadMoreWrap = document.getElementById('gallery-load-more-wrap');
  if (loadMoreWrap) {
    const hasMore = (start + GALLERY_PAGE_SZ) < filteredGallery.length;
    loadMoreWrap.style.display = hasMore ? 'block' : 'none';
  }
}

window.loadMoreGallery = function() {
  galleryPage++;
  renderGalleryPage(false);
};

// ==================== GALLERY FILTER ====================
document.querySelectorAll('.gal-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gal-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    filteredGallery = (filter === 'all')
      ? [...galleryData]
      : galleryData.filter(item => item.category === filter);

    galleryPage = 0;
    renderGalleryPage(true);
  });
});

// ==================== LIGHTBOX ====================
function openLightbox(idx) {
  currentLightboxIdx = idx;
  const item = filteredGallery[idx];
  if (!item) return;

  const overlay   = document.getElementById('lightbox');
  const imgEl     = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');

  imgEl.src = item.image_url;
  imgEl.alt = item.title;
  captionEl.innerHTML = `<strong>${item.title}</strong>${item.description ? ' — ' + item.description : ''}<br><span style="color:var(--gold);font-size:0.8rem;">${item.category}</span>`;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('active');
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  const newIdx = currentLightboxIdx + dir;
  if (newIdx >= 0 && newIdx < filteredGallery.length) {
    openLightbox(newIdx);
  }
}

// Lightbox events
document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
document.getElementById('lightbox-prev')?.addEventListener('click',  () => lightboxNav(-1));
document.getElementById('lightbox-next')?.addEventListener('click',  () => lightboxNav(+1));

document.getElementById('lightbox')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lightbox')?.classList.contains('active')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   lightboxNav(-1);
  if (e.key === 'ArrowRight')  lightboxNav(+1);
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
});
