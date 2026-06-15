/* ============================================================
   admin.js — Admin Dashboard Logic (FINAL v3)
   Direct Supabase REST API (no PHP needed)
   ============================================================ */

// ====== CONFIG — EDIT SESUAI PROJECT KAMU ======
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
const CLOUDINARY_CLOUD = 'YOUR_CLOUD_NAME';
const CLOUDINARY_PRESET = 'pramuka_inhil'; // unsigned upload preset
// ================================================

const API_BASE = `${SUPABASE_URL}/rest/v1`;
const adminToken = SUPABASE_ANON;
let editingProgId = null;

// ==================== SUPABASE HELPERS ====================
async function sbGet(table, params = '') {
  const res = await fetch(`${API_BASE}/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${API_BASE}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${table} failed: ${res.status}`);
  }
  return res.json();
}

async function sbPatch(table, id, body) {
  const res = await fetch(`${API_BASE}/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PATCH ${table} failed: ${res.status}`);
  }
  return res.json();
}

async function sbDelete(table, id) {
  const res = await fetch(`${API_BASE}/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
  return true;
}

// ==================== TOAST ====================
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast-item ${type !== 'success' ? 'error' : ''}`;

  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  el.innerHTML = `<span>${icons[type] || '📢'}</span><span style="flex:1;">${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'slide-out 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ==================== LOADING ====================
function setLoading(show) {
  const ov = document.getElementById('loading-overlay');
  if (ov) ov.style.display = show ? 'flex' : 'none';
}

// ==================== PANEL NAVIGATION ====================
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const panel = document.getElementById(`panel-${name}`);
  if (panel) panel.classList.add('active');

  const titles = {
    dashboard:     '📊 Dashboard Overview',
    gallery:       '🖼️ Manajemen Galeri',
    programs:      '📋 Program Kerja',
    members:       '👥 Manajemen Anggota',
    messages:      '✉️ Kotak Pesan',
    announcements: '📢 Manajemen Pengumuman',
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[name] || name;

  // Mark active sidebar link
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    if (btn.getAttribute('onclick')?.includes(`'${name}'`)) {
      btn.classList.add('active');
    }
  });

  // Load data for panel
  if (name === 'dashboard')     loadDashboardStats();
  if (name === 'gallery')       loadAdminGallery();
  if (name === 'programs')      loadAdminPrograms();
  if (name === 'members')       loadMembers();
  if (name === 'messages')      loadMessages();
  if (name === 'announcements') loadAdminAnnouncements();

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth < 768) {
    sidebar.classList.remove('open');
  }
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
  const stats = {
    gallery:  { el: 'stat-gallery',   query: 'gallery?select=count', key: null },
    programs: { el: 'stat-programs',  query: 'programs?select=count&is_active=eq.true', key: null },
    members:  { el: 'stat-members',   query: 'members?select=count', key: null },
    pending:  { el: 'stat-pending',   query: 'members?select=count&status=eq.pending', key: null },
    messages: { el: 'stat-messages',  query: 'messages?select=count&is_read=eq.false', key: null },
  };

  await Promise.allSettled(
    Object.entries(stats).map(async ([key, cfg]) => {
      try {
        const res = await fetch(`${API_BASE}/${cfg.query}`, {
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${adminToken}`,
            'Prefer': 'count=exact',
          }
        });
        const count = res.headers.get('content-range')?.split('/')[1] || '0';
        const el = document.getElementById(cfg.el);
        if (el) {
          animateNumber(el, parseInt(count) || 0);
        }

        // Update badges
        if (key === 'pending') updateBadge('badge-pending', parseInt(count));
        if (key === 'messages') updateBadge('badge-messages', parseInt(count));
      } catch(e) {
        const el = document.getElementById(cfg.el);
        if (el) el.textContent = '—';
      }
    })
  );
}

function animateNumber(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

function updateBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (count > 0) {
    el.textContent = count > 99 ? '99+' : count;
    el.style.display = 'inline-block';
  } else {
    el.style.display = 'none';
  }
}

// ==================== GALLERY ADMIN ====================
async function loadAdminGallery() {
  const grid = document.getElementById('admin-gallery-grid');
  const countEl = document.getElementById('gallery-count');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><div class="ei">⏳</div><p>Memuat foto...</p></div>';

  try {
    const data = await sbGet('gallery', 'order=created_at.desc&limit=60');
    if (countEl) countEl.textContent = `${data.length} foto`;

    if (data.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="ei">📷</div><p>Belum ada foto. Upload foto pertamamu!</p></div>';
      return;
    }

    grid.innerHTML = data.map(item => `
      <div class="gallery-admin-item" id="gitem-${item.id}">
        <img class="gallery-admin-img" src="${item.image_url}" alt="${item.title}" loading="lazy" onerror="this.src='img/foto1.jpeg'" />
        <div class="gallery-admin-info">
          <div class="gallery-admin-title">${item.title}</div>
          <div class="gallery-admin-cat">${item.category}</div>
        </div>
        <button class="gallery-admin-del" onclick="deleteGallery('${item.id}', '${item.public_id || ''}')" title="Hapus foto">✕</button>
      </div>
    `).join('');
  } catch(e) {
    grid.innerHTML = `<div class="empty-state"><div class="ei">⚠️</div><p>${e.message}</p></div>`;
    toast('Gagal memuat galeri: ' + e.message, 'error');
  }
}

async function deleteGallery(id, publicId) {
  if (!confirm('Hapus foto ini?')) return;

  try {
    // Delete from Cloudinary if public_id exists
    if (publicId) {
      // Note: Cloudinary delete requires signed request on backend
      // For now we just delete from DB
    }
    await sbDelete('gallery', id);
    document.getElementById(`gitem-${id}`)?.remove();
    toast('✅ Foto berhasil dihapus');

    const grid = document.getElementById('admin-gallery-grid');
    const countEl = document.getElementById('gallery-count');
    if (grid && !grid.querySelector('.gallery-admin-item')) {
      grid.innerHTML = '<div class="empty-state"><div class="ei">📷</div><p>Belum ada foto.</p></div>';
    }
    const remaining = document.querySelectorAll('.gallery-admin-item').length;
    if (countEl) countEl.textContent = `${remaining} foto`;
  } catch(e) {
    toast('Gagal menghapus foto: ' + e.message, 'error');
  }
}

// Upload gallery
document.getElementById('btn-show-upload-form')?.addEventListener('click', () => {
  const card = document.getElementById('upload-form-card');
  card.style.display = card.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('btn-cancel-upload')?.addEventListener('click', () => {
  document.getElementById('upload-form-card').style.display = 'none';
  document.getElementById('form-upload-gallery')?.reset();
  document.getElementById('upload-preview').style.display = 'none';
});

// File preview
document.getElementById('upload-file-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('preview-img').src = ev.target.result;
    document.getElementById('preview-name').textContent = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
    document.getElementById('upload-preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// Drag & drop
const dropArea = document.getElementById('upload-drop-area');
if (dropArea) {
  ['dragenter','dragover'].forEach(ev => {
    dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
  });
  ['dragleave','drop'].forEach(ev => {
    dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); });
  });
  dropArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('upload-file-input').files = dt.files;
      document.getElementById('upload-file-input').dispatchEvent(new Event('change'));
    }
  });
}

// Upload form submit
document.getElementById('form-upload-gallery')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('btn-do-upload');
  const file = document.getElementById('upload-file-input').files[0];
  if (!file) { toast('Pilih file foto terlebih dahulu!', 'error'); return; }

  const title    = e.target.title.value;
  const category = e.target.category.value;
  const desc     = e.target.description?.value || '';

  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spin-admin"></span> Mengupload...';

  try {
    let imageUrl = '';
    let publicId = '';

    if (CLOUDINARY_CLOUD && CLOUDINARY_CLOUD !== 'YOUR_CLOUD_NAME') {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file',          file);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      formData.append('folder',        'pramuka_inhil/gallery');

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!cloudRes.ok) throw new Error('Cloudinary upload gagal');
      const cloudData = await cloudRes.json();
      imageUrl = cloudData.secure_url;
      publicId = cloudData.public_id;
    } else {
      // If Cloudinary not configured, store as base64 preview (demo)
      imageUrl = URL.createObjectURL(file);
      toast('⚠️ Cloudinary belum dikonfigurasi. Gambar tidak tersimpan permanen.', 'warning');
    }

    // Save to Supabase
    await sbPost('gallery', {
      title,
      category,
      description: desc,
      image_url: imageUrl,
      public_id: publicId,
      uploaded_by: 'admin',
    });

    toast('✅ Foto berhasil diupload!');
    document.getElementById('upload-form-card').style.display = 'none';
    e.target.reset();
    document.getElementById('upload-preview').style.display = 'none';
    loadAdminGallery();
  } catch(err) {
    toast('Upload gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '⬆️ Upload ke Cloudinary';
  }
});

// ==================== PROGRAMS ADMIN ====================
async function loadAdminPrograms() {
  const tbody = document.getElementById('programs-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--gray-400);">Memuat...</td></tr>';

  try {
    const data = await sbGet('programs', 'order=sort_order.asc');

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--gray-400);">Belum ada program.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td style="font-size:1.5rem;">${p.icon || '🏕️'}</td>
        <td><strong>${p.title}</strong></td>
        <td><span class="status-badge status-pending" style="text-transform:none;">${p.category}</span></td>
        <td>${p.schedule || '—'}</td>
        <td>
          <div style="display:flex;gap:8px;">
            <button class="btn-secondary" onclick="editProgram(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
            <button class="btn-danger"    onclick="deleteProgram('${p.id}')">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--danger);">${e.message}</td></tr>`;
    toast('Gagal memuat program: ' + e.message, 'error');
  }
}

document.getElementById('btn-show-prog-form')?.addEventListener('click', () => {
  editingProgId = null;
  document.getElementById('prog-form-title').textContent = 'Tambah Program Baru';
  document.getElementById('prog-edit-id').value = '';
  document.getElementById('form-program')?.reset();
  document.getElementById('prog-form-card').style.display = 'block';
});

document.getElementById('btn-cancel-prog')?.addEventListener('click', () => {
  document.getElementById('prog-form-card').style.display = 'none';
  editingProgId = null;
});

function editProgram(prog) {
  editingProgId = prog.id;
  document.getElementById('prog-form-title').textContent = 'Edit Program';
  document.getElementById('prog-edit-id').value = prog.id;
  document.getElementById('prog-title').value    = prog.title;
  document.getElementById('prog-category').value = prog.category;
  document.getElementById('prog-icon').value     = prog.icon || '';
  document.getElementById('prog-desc').value     = prog.description;
  document.getElementById('prog-schedule').value = prog.schedule || '';
  document.getElementById('prog-form-card').style.display = 'block';
  document.getElementById('prog-form-card').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('form-program')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save-prog');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spin-admin"></span> Menyimpan...';

  const body = {
    title:       document.getElementById('prog-title').value,
    category:    document.getElementById('prog-category').value,
    icon:        document.getElementById('prog-icon').value || '🏕️',
    description: document.getElementById('prog-desc').value,
    schedule:    document.getElementById('prog-schedule').value,
    is_active:   true,
    updated_at:  new Date().toISOString(),
  };

  try {
    if (editingProgId) {
      await sbPatch('programs', editingProgId, body);
      toast('✅ Program berhasil diperbarui!');
    } else {
      body.sort_order = 99;
      await sbPost('programs', body);
      toast('✅ Program berhasil ditambahkan!');
    }
    document.getElementById('prog-form-card').style.display = 'none';
    e.target.reset();
    editingProgId = null;
    loadAdminPrograms();
  } catch(err) {
    toast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Program';
  }
});

async function deleteProgram(id) {
  if (!confirm('Yakin hapus program ini?')) return;
  try {
    await sbDelete('programs', id);
    toast('✅ Program dihapus');
    loadAdminPrograms();
  } catch(e) {
    toast('Gagal menghapus: ' + e.message, 'error');
  }
}

// ==================== MEMBERS ADMIN ====================
async function loadMembers(statusFilter = null) {
  const tbody = document.getElementById('members-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400);">Memuat...</td></tr>';

  try {
    let params = 'order=created_at.desc&limit=100';
    if (statusFilter) params += `&status=eq.${statusFilter}`;

    const data = await sbGet('members', params);

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400);">Tidak ada data.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(m => `
      <tr class="${m.status === 'pending' ? 'msg-unread' : ''}">
        <td>
          ${m.photo_url ? `<img src="${m.photo_url}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />` : '<div style="width:36px;height:36px;border-radius:50%;background:var(--gray-200);display:flex;align-items:center;justify-content:center;font-size:1rem;">👤</div>'}
        </td>
        <td><strong>${m.name}</strong></td>
        <td>${m.nis}</td>
        <td>${m.class}</td>
        <td>${m.phone || '—'}</td>
        <td>
          <span class="status-badge status-${m.status}">
            ${{ pending:'⏳ Pending', accepted:'✅ Diterima', rejected:'❌ Ditolak' }[m.status] || m.status}
          </span>
        </td>
        <td>${new Date(m.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${m.status !== 'accepted' ? `<button class="btn-success" onclick="updateMemberStatus('${m.id}','accepted')">✅ Terima</button>` : ''}
            ${m.status !== 'rejected' ? `<button class="btn-danger"  onclick="updateMemberStatus('${m.id}','rejected')">❌ Tolak</button>` : ''}
            <button class="btn-secondary" onclick="deleteMember('${m.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger);">${e.message}</td></tr>`;
    toast('Gagal memuat anggota: ' + e.message, 'error');
  }
}

async function updateMemberStatus(id, status) {
  try {
    await sbPatch('members', id, { status, updated_at: new Date().toISOString() });
    toast(`✅ Status diperbarui: ${status}`);
    loadMembers();
    loadDashboardStats();
  } catch(e) {
    toast('Gagal update status: ' + e.message, 'error');
  }
}

async function deleteMember(id) {
  if (!confirm('Hapus data anggota ini?')) return;
  try {
    await sbDelete('members', id);
    toast('✅ Data anggota dihapus');
    loadMembers();
    loadDashboardStats();
  } catch(e) {
    toast('Gagal menghapus: ' + e.message, 'error');
  }
}

// ==================== MESSAGES ADMIN ====================
async function loadMessages() {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-400);">Memuat...</td></tr>';

  try {
    const data = await sbGet('messages', 'order=created_at.desc&limit=100');

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-400);">Belum ada pesan.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(msg => `
      <tr class="${!msg.is_read ? 'msg-unread' : ''}" id="msgrow-${msg.id}">
        <td>
          ${!msg.is_read
            ? '<span class="status-badge status-unread">🔵 Baru</span>'
            : '<span style="color:var(--gray-400);font-size:0.8rem;">✓ Dibaca</span>'}
        </td>
        <td><strong>${msg.name}</strong></td>
        <td><a href="mailto:${msg.email}" style="color:var(--navy-med);">${msg.email}</a></td>
        <td>${msg.subject || '(no subject)'}</td>
        <td>${new Date(msg.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-secondary" onclick="readMessage('${msg.id}', this)">👁️ Baca</button>
            <button class="btn-danger"    onclick="deleteMessage('${msg.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger);">${e.message}</td></tr>`;
    toast('Gagal memuat pesan: ' + e.message, 'error');
  }
}

async function readMessage(id, btn) {
  try {
    // Mark as read
    await sbPatch('messages', id, { is_read: true });

    // Get message detail
    const res  = await fetch(`${API_BASE}/messages?id=eq.${id}`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${adminToken}` }
    });
    const [msg] = await res.json();

    document.getElementById('msg-modal-subject').textContent = msg.subject || '(no subject)';
    document.getElementById('msg-modal-name').textContent    = msg.name;
    document.getElementById('msg-modal-email').textContent   = msg.email;
    document.getElementById('msg-modal-body').textContent    = msg.message;
    document.getElementById('msg-modal-reply').href          = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || '')}`;

    const modal = new bootstrap.Modal(document.getElementById('msgModal'));
    modal.show();

    // Update row UI
    const row = document.getElementById(`msgrow-${id}`);
    if (row) {
      row.classList.remove('msg-unread');
      row.querySelector('td:first-child').innerHTML = '<span style="color:var(--gray-400);font-size:0.8rem;">✓ Dibaca</span>';
    }

    loadDashboardStats();
  } catch(e) {
    toast('Gagal membuka pesan: ' + e.message, 'error');
  }
}

async function deleteMessage(id) {
  if (!confirm('Hapus pesan ini?')) return;
  try {
    await sbDelete('messages', id);
    document.getElementById(`msgrow-${id}`)?.remove();
    toast('✅ Pesan dihapus');
    loadDashboardStats();
  } catch(e) {
    toast('Gagal menghapus: ' + e.message, 'error');
  }
}

// ==================== MOBILE SIDEBAR ====================
document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});

// ==================== ANNOUNCEMENTS ADMIN ====================
let editingAnncId = null;

async function loadAdminAnnouncements() {
  const tbody   = document.getElementById('annc-tbody');
  const countEl = document.getElementById('annc-count');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400);">Memuat...</td></tr>';

  try {
    // Admin melihat semua (aktif + nonaktif) — pakai service key header di PHP
    // Tapi karena ini direct Supabase, kita ambil semua dengan token admin
    const res = await fetch(`${API_BASE}/announcements?order=created_at.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });
    const data = await res.json();
    if (countEl) countEl.textContent = `${data.length} pengumuman`;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-400);">Belum ada pengumuman.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(a => `
      <tr id="anncrow-${a.id}">
        <td>
          ${a.image_url
            ? `<img src="${a.image_url}" style="width:60px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--gray-200);" onerror="this.style.display='none'" />`
            : `<div style="width:60px;height:44px;border-radius:8px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📢</div>`}
        </td>
        <td><strong style="color:var(--navy);">${a.title}</strong></td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--gray-600);font-size:0.82rem;">${a.content}</td>
        <td>
          ${a.link_url
            ? `<a href="${a.link_url}" target="_blank" style="color:var(--navy-light);font-size:0.8rem;font-weight:600;">${a.link_label || 'Link'} ↗</a>`
            : '<span style="color:var(--gray-400);font-size:0.8rem;">—</span>'}
        </td>
        <td>
          <span class="status-badge ${a.is_active ? 'status-accepted' : 'status-rejected'}">
            ${a.is_active ? '✅ Aktif' : '🔕 Nonaktif'}
          </span>
        </td>
        <td style="font-size:0.8rem;color:var(--gray-600);">
          ${new Date(a.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-secondary" onclick="editAnnouncement(${JSON.stringify(a).replace(/"/g,'&quot;')})">✏️ Edit</button>
            <button class="btn-danger"    onclick="deleteAnnouncement('${a.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger);">${e.message}</td></tr>`;
    toast('Gagal memuat pengumuman: ' + e.message, 'error');
  }
}

// Preview gambar saat URL diketik
document.getElementById('annc-image')?.addEventListener('input', function() {
  const preview = document.getElementById('annc-img-preview');
  if (!preview) return;
  const url = this.value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=color:var(--danger);font-size:0.78rem;>URL gambar tidak valid</span>'" />`;
  } else {
    preview.innerHTML = 'Masukkan URL gambar untuk preview';
  }
});

// Tombol tampilkan form
document.getElementById('btn-show-annc-form')?.addEventListener('click', () => {
  editingAnncId = null;
  document.getElementById('annc-form-title').textContent = 'Tambah Pengumuman Baru';
  document.getElementById('annc-edit-id').value = '';
  document.getElementById('form-announcement')?.reset();
  document.getElementById('annc-link-label').value = 'Daftar Sekarang';
  document.getElementById('annc-status').value = 'true';
  document.getElementById('annc-img-preview').innerHTML = 'Masukkan URL gambar untuk preview';
  document.getElementById('annc-form-card').style.display = 'block';
  document.getElementById('annc-form-card').scrollIntoView({ behavior: 'smooth' });
});

// Batal
document.getElementById('btn-cancel-annc')?.addEventListener('click', () => {
  document.getElementById('annc-form-card').style.display = 'none';
  editingAnncId = null;
});

// Edit
function editAnnouncement(a) {
  editingAnncId = a.id;
  document.getElementById('annc-form-title').textContent = 'Edit Pengumuman';
  document.getElementById('annc-edit-id').value    = a.id;
  document.getElementById('annc-title').value      = a.title;
  document.getElementById('annc-content').value    = a.content;
  document.getElementById('annc-image').value      = a.image_url || '';
  document.getElementById('annc-link').value       = a.link_url  || '';
  document.getElementById('annc-link-label').value = a.link_label || 'Daftar Sekarang';
  document.getElementById('annc-status').value     = String(a.is_active);

  // Update preview
  const preview = document.getElementById('annc-img-preview');
  if (a.image_url) {
    preview.innerHTML = `<img src="${a.image_url}" style="width:100%;height:100%;object-fit:cover;" />`;
  } else {
    preview.innerHTML = 'Masukkan URL gambar untuk preview';
  }

  document.getElementById('annc-form-card').style.display = 'block';
  document.getElementById('annc-form-card').scrollIntoView({ behavior: 'smooth' });
}

// Submit form
document.getElementById('form-announcement')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save-annc');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spin-admin"></span> Menyimpan...';

  const body = {
    title:      document.getElementById('annc-title').value.trim(),
    content:    document.getElementById('annc-content').value.trim(),
    image_url:  document.getElementById('annc-image').value.trim() || null,
    link_url:   document.getElementById('annc-link').value.trim()  || null,
    link_label: document.getElementById('annc-link-label').value.trim() || 'Daftar Sekarang',
    is_active:  document.getElementById('annc-status').value === 'true',
    updated_at: new Date().toISOString(),
  };

  try {
    if (editingAnncId) {
      await sbPatch('announcements', editingAnncId, body);
      toast('✅ Pengumuman berhasil diperbarui!');
    } else {
      body.created_by = 'admin';
      await sbPost('announcements', body);
      toast('✅ Pengumuman berhasil ditambahkan!');
    }
    document.getElementById('annc-form-card').style.display = 'none';
    e.target.reset();
    editingAnncId = null;
    loadAdminAnnouncements();
  } catch(err) {
    toast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Pengumuman';
  }
});

// Hapus
async function deleteAnnouncement(id) {
  if (!confirm('Yakin hapus pengumuman ini?')) return;
  try {
    await sbDelete('announcements', id);
    document.getElementById(`anncrow-${id}`)?.remove();
    toast('✅ Pengumuman dihapus');
    loadAdminAnnouncements();
  } catch(e) {
    toast('Gagal menghapus: ' + e.message, 'error');
  }
}

// ==================== EXPOSE GLOBALS ====================
window.showPanel          = showPanel;
window.editProgram        = editProgram;
window.deleteProgram      = deleteProgram;
window.deleteGallery      = deleteGallery;
window.loadMembers        = loadMembers;
window.updateMemberStatus = updateMemberStatus;
window.deleteMember       = deleteMember;
window.readMessage        = readMessage;
window.deleteMessage      = deleteMessage;
window.editAnnouncement   = editAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;

// Spinner style
const spinStyle = document.createElement('style');
spinStyle.textContent = `.loading-spin-admin{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slide-out{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}`;
document.head.appendChild(spinStyle);

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  showPanel('dashboard');
});
