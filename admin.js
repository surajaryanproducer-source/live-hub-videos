;(function(){ if (window.__LIVEHUB_ADMIN_LOADED__) return; window.__LIVEHUB_ADMIN_LOADED__ = true;
const API_BASE = '/.netlify/functions/content';
async function apiGet(){ const r = await fetch(API_BASE, { cache: 'no-store' }); return r.ok ? await r.json() : { items: [] }; }
async function apiPost(op, payload){ const r = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, ...payload }) }); return await r.json(); }
async function functionsAvailable(){ try{ const r = await fetch(API_BASE, { method: 'GET', cache: 'no-store' }); return r.ok; } catch { return false; } }
function saveVideo(videoTitle, videoURL, profileName, videoDuration) {
  try {
    const catEl = document.getElementById('itemCategory');
    const fileInput = document.getElementById('itemImageFile');
    const previewEl = document.getElementById('itemImagePreview');
    let thumbnail = '';
    if (previewEl && previewEl.src) thumbnail = previewEl.src;
    if (!thumbnail && fileInput && fileInput.files && fileInput.files[0]) {
      const f = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        thumbnail = e.target.result || '';
        doPost();
      };
      reader.readAsDataURL(f);
      return;
    }
    function doPost(){
      fetch('/.netlify/functions/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'add',
          title: videoTitle,
          url: videoURL,
          profile: profileName,
          duration: videoDuration,
          category: catEl ? String(catEl.value || '') : '',
          thumbnail
        })
      })
      .then(res => res.json())
      .then(data => {
        alert('Video saved successfully!');
      })
      .catch(() => {
        alert('Save failed. Please try again.');
      });
    }
    doPost();
  } catch {
    alert('Save failed. Please try again.');
  }
}
const loginForm = document.getElementById('loginForm');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginMsg = document.getElementById('loginMsg');
const itemsList = document.getElementById('itemsList');
const itemModalEl = document.getElementById('itemModal');
const itemModal = itemModalEl ? new bootstrap.Modal(itemModalEl) : null;
const categoriesListEl = document.getElementById('categoriesList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const catNameInput = document.getElementById('catNameInput');
const itemCategorySelect = document.getElementById('itemCategory');
const addProfileBtn = document.getElementById('addProfileBtn');
const profileNameInput = document.getElementById('profileNameInput');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const profilesListEl = document.getElementById('profilesList');
const itemProfileSelect = document.getElementById('itemProfileSelect');
const profileDetailModalEl = document.getElementById('profileDetailModal');
const profileDetailModal = profileDetailModalEl ? new bootstrap.Modal(profileDetailModalEl) : null;
const profileDetailTitleEl = document.getElementById('profileDetailTitle');
const profileDetailAvatarEl = document.getElementById('profileDetailAvatar');
const profileDetailCountEl = document.getElementById('profileDetailCount');
const profileDetailListEl = document.getElementById('profileDetailList');
const profileDetailAddBtn = document.getElementById('profileDetailAddBtn');
const profileDetailEditBtn = document.getElementById('profileDetailEditBtn');
const profileDetailDeleteBtn = document.getElementById('profileDetailDeleteBtn');
let currentProfileDetail = '';

const SESSION_HOURS = 8;
function isSessionValid() {
  return document.cookie.split(';').map(s => s.trim()).some(s => s.startsWith('livehub_admin=1'));
}
function setSession() {
  document.cookie = 'livehub_admin=1; Max-Age=' + (SESSION_HOURS*60*60) + '; path=/';
}
function clearSession() {
  document.cookie = 'livehub_admin=; Max-Age=0; path=/';
}
async function getStoredAdmin() {
  try {
    const r = await fetch('assets/admin.json', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      return j && typeof j === 'object' ? j : null;
    }
  } catch {}
  return null;
}
function isGmail(addr) {
  try {
    return /^[^@\s]+@gmail\.com$/i.test(String(addr || ''));
  } catch { return false; }
}

function getCategories() {
  const raw = localStorage.getItem('livehub_categories');
  if (!raw) return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
}
function saveCategories(arr) {
  const cleaned = Array.from(new Set((arr || []).map(s => String(s || '').trim()).filter(Boolean)));
  localStorage.setItem('livehub_categories', JSON.stringify(cleaned));
}
function renderCategories() {
  if (!categoriesListEl) return;
  categoriesListEl.innerHTML = '';
  const cats = getCategories();
  cats.forEach(name => {
    const col = document.createElement('div');
    col.className = 'col-auto';
    col.innerHTML = `
      <div class="d-flex align-items-center gap-2 border rounded px-2 py-1">
        <span>${name}</span>
        <button class="btn btn-sm btn-outline-danger" data-action="del-cat" data-name="${name}">Delete</button>
      </div>
    `;
    categoriesListEl.appendChild(col);
  });
}

function renderCategorySelect() {
  if (!itemCategorySelect) return;
  const cats = getCategories();
  const finalCats = cats.includes('Uncategorized') ? cats : [...cats, 'Uncategorized'];
  itemCategorySelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = 'Select category';
  itemCategorySelect.appendChild(opt);
  finalCats.forEach(c => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    itemCategorySelect.appendChild(o);
  });
}

function getProfiles() {
  const raw = localStorage.getItem('livehub_profiles');
  if (!raw) return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
}
function saveProfiles(arr) {
  const cleaned = (arr || []).filter(p => p && String(p.name||'').trim()).map(p => ({ name: String(p.name).trim(), photo: p.photo || '' }));
  localStorage.setItem('livehub_profiles', JSON.stringify(cleaned));
}
function renderProfiles() {
  const profiles = getProfiles();
  const data = getContentSync();
  const items = Array.isArray(data.items) ? data.items : [];
  if (profilesListEl) {
    profilesListEl.innerHTML = '';
    profiles.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';
      const img = p.photo ? `<img src="${p.photo}" alt="${p.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : `<div style="width:40px;height:40px;border-radius:50%;background:#e9ecef;"></div>`;
      const count = items.filter(it => String(it.profile||'') === p.name).length;
      col.innerHTML = `
        <div class="d-flex align-items-center justify-content-between border rounded px-2 py-2">
          <div class="d-flex align-items-center gap-2">
            ${img}
            <strong>${p.name}</strong>
            <span class="small text-muted">(${count} ${count===1?'video':'videos'})</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-primary" data-action="view-profile" data-name="${p.name}">View</button>
            <label class="btn btn-sm btn-outline-secondary mb-0">
              Change Photo
              <input type="file" data-name="${p.name}" class="d-none" accept="image/png,image/jpeg">
            </label>
            <button class="btn btn-sm btn-outline-danger" data-action="del-profile" data-name="${p.name}">Delete</button>
          </div>
        </div>
      `;
      profilesListEl.appendChild(col);
    });
  }
  if (itemProfileSelect) {
    itemProfileSelect.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Select profile';
    itemProfileSelect.appendChild(opt);
    profiles.forEach(p => {
      const o = document.createElement('option');
      o.value = p.name;
      o.textContent = p.name;
      itemProfileSelect.appendChild(o);
    });
  }
}

async function getInitialContent() {
  try {
    const res = await fetch('/.netlify/functions/content', { cache: 'no-store' });
    return res.ok ? await res.json() : { items: [] };
  } catch {
    return { items: [] };
  }
}

function getContentSync() {
  const raw = localStorage.getItem('livehub_content');
  if (!raw) return { items: [] };
  try { return JSON.parse(raw); } catch (e) { return { items: [] }; }
}

function saveContent(data) {
  localStorage.setItem('livehub_content', JSON.stringify(data));
  localStorage.setItem('livehub_content_version', String(Date.now()));
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.textContent = '';
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  if (!isGmail(email)) { loginMsg.textContent = 'Please use Gmail address'; return; }
  try {
    let authOk = false;
    try {
      const res = await apiPost('auth', { email, password });
      authOk = !!(res && res.ok);
    } catch {}
    if (!authOk) {
      try {
        const stored = await getStoredAdmin();
        if (stored) {
          const se = String(stored.email || '').trim().toLowerCase();
          const sp = String(stored.passwordPlain || stored.password || '');
          if (se && email === se && password === sp) authOk = true;
        }
      } catch {}
      const DEFAULT_EMAIL = 'lmahadev50@gmail.com';
      const DEFAULT_PASS = 'changeMe123!';
      if (email === DEFAULT_EMAIL && password === DEFAULT_PASS) authOk = true;
    }
    if (authOk) {
      setSession();
      loginView.classList.add('d-none');
      dashboardView.classList.remove('d-none');
      await refreshItems();
    } else {
      loginMsg.textContent = 'Invalid credentials';
    }
  } catch {
    const DEFAULT_EMAIL = 'lmahadev50@gmail.com';
    const DEFAULT_PASS = 'changeMe123!';
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASS) {
      setSession();
      loginView.classList.add('d-none');
      dashboardView.classList.remove('d-none');
      await refreshItems();
    } else {
      loginMsg.textContent = 'Login failed. Please try again.';
    }
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  loginView.classList.remove('d-none');
  dashboardView.classList.add('d-none');
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => { clearSession(); window.location.href = '/'; });
  }
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const newAdminEmail = document.getElementById('newAdminEmail');
  const newAdminPassword = document.getElementById('newAdminPassword');
  const settingsMsg = document.getElementById('settingsMsg');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      if (!isSessionValid()) { if (settingsMsg) settingsMsg.textContent = 'Please login first'; return; }
      const emailVal = String((newAdminEmail && newAdminEmail.value) || '').trim().toLowerCase();
      const passVal = String(newAdminPassword.value || '').trim();
      if (!emailVal) { if (settingsMsg) settingsMsg.textContent = 'Gmail cannot be empty'; return; }
      if (!/^[^@\s]+@gmail\.com$/i.test(emailVal)) { if (settingsMsg) settingsMsg.textContent = 'Please enter a valid Gmail address'; return; }
      if (!passVal) { if (settingsMsg) settingsMsg.textContent = 'Password cannot be empty'; return; }
      try {
        fetch('/.netlify/functions/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'setadmin', email: emailVal, password: passVal })
        }).then(() => { if (settingsMsg) settingsMsg.textContent = 'Admin updated'; })
          .catch(() => { if (settingsMsg) settingsMsg.textContent = 'Update failed'; });
      } catch {
        if (settingsMsg) settingsMsg.textContent = 'Update failed';
      }
      if (newAdminPassword) newAdminPassword.value = '';
    });
  }
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
      const name = String(catNameInput.value || '').trim();
      if (!name) return;
      const cats = getCategories();
      if (!cats.includes(name)) {
        cats.push(name);
        saveCategories(cats);
        renderCategories();
        renderCategorySelect();
      }
      catNameInput.value = '';
    });
  }
  if (categoriesListEl) {
    categoriesListEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action="del-cat"]');
      if (!btn) return;
      const name = btn.getAttribute('data-name');
      if (!name) return;
      if (!confirm('Delete category "' + name + '"?')) return;
      let cats = getCategories().filter(c => c !== name);
      const data = getContentSync();
      const items = Array.isArray(data.items) ? data.items : [];
      let needUncat = false;
      data.items = items.map(it => {
        if (String(it.category || '') === name) {
          needUncat = true;
          return { ...it, category: 'Uncategorized' };
        }
        return it;
      });
      saveContent(data);
      if (needUncat && !cats.includes('Uncategorized')) cats = [...cats, 'Uncategorized'];
      saveCategories(cats);
      renderCategories();
      renderCategorySelect();
      await refreshItems();
    });
  }
  if (addProfileBtn) {
    addProfileBtn.addEventListener('click', async () => {
      const name = String(profileNameInput.value || '').trim();
      if (!name) return;
      let photoData = '';
      const file = profilePhotoInput && profilePhotoInput.files && profilePhotoInput.files[0];
      if (file) {
        if (!['image/jpeg','image/png'].includes(file.type)) { alert('Please upload a JPG or PNG image'); return; }
        photoData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const profiles = getProfiles();
      if (!profiles.find(p => p.name === name)) profiles.push({ name, photo: photoData });
      saveProfiles(profiles);
      renderProfiles();
      profileNameInput.value = '';
      if (profilePhotoInput) profilePhotoInput.value = '';
    });
  }
  if (profilesListEl) {
    profilesListEl.addEventListener('click', async (e) => {
      const del = e.target.closest('button[data-action="del-profile"]');
      const view = e.target.closest('button[data-action="view-profile"]');
      if (view) {
        const name = view.getAttribute('data-name');
        if (!name) return;
        currentProfileDetail = name;
        const data = getContentSync();
        const items = Array.isArray(data.items) ? data.items : [];
        const list = items.filter(it => String(it.profile||'') === name);
        if (profileDetailTitleEl) profileDetailTitleEl.textContent = name;
        try {
          const raw = localStorage.getItem('livehub_profiles');
          const arr = raw ? JSON.parse(raw) : [];
          const p = Array.isArray(arr) ? arr.find(x => x && x.name === name) : null;
          if (p && p.photo) { profileDetailAvatarEl.src = p.photo; profileDetailAvatarEl.style.display = 'inline-block'; } else { profileDetailAvatarEl.style.display = 'none'; }
        } catch { if (profileDetailAvatarEl) profileDetailAvatarEl.style.display = 'none'; }
        if (profileDetailCountEl) profileDetailCountEl.textContent = `${list.length} ${list.length===1?'video':'videos'}`;
        if (profileDetailListEl) {
          profileDetailListEl.innerHTML = '';
          list.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6';
            const img = item.thumbnail || item.image || '';
            col.innerHTML = `
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">${item.title || ''}</h5>
                  <div class="d-flex align-items-center gap-2 mb-2">
                    ${img ? `<img src="${img}" alt="" style="width:56px;height:56px;border-radius:8px;object-fit:cover;">` : ''}
                    <div class="small text-muted">Category: ${item.category || '—'}</div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" data-action="edit-profile-item" data-id="${item.id}">Edit</button>
                    <button class="btn btn-secondary btn-sm" data-action="delete-profile-item" data-id="${item.id}">Delete</button>
                  </div>
                </div>
              </div>
            `;
            profileDetailListEl.appendChild(col);
          });
        }
        if (profileDetailModal) profileDetailModal.show();
        return;
      }
      if (del) {
        const name = del.getAttribute('data-name');
        if (!name) return;
        if (!confirm('Delete profile "' + name + '" and all associated videos?')) return;
        const profiles = getProfiles().filter(p => p.name !== name);
        saveProfiles(profiles);
        const data = getContentSync();
        data.items = (data.items || []).filter(it => String(it.profile||'') !== name);
        saveContent(data);
        renderProfiles();
        await refreshItems();
        return;
      }
      const fileInput = e.target.closest('label') && e.target.closest('label').querySelector('input[type="file"][data-name]');
      if (!fileInput) return;
      fileInput.addEventListener('change', async () => {
        const name = fileInput.getAttribute('data-name');
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!['image/jpeg','image/png'].includes(file.type)) { alert('Please upload a JPG or PNG image'); fileInput.value=''; return; }
        const photoData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const profiles = getProfiles().map(p => p.name===name ? { ...p, photo: photoData } : p);
        saveProfiles(profiles);
        renderProfiles();
      }, { once: true });
    });
  }
  if (profileDetailAddBtn) {
    profileDetailAddBtn.addEventListener('click', () => {
      if (!currentProfileDetail || !itemModal) return;
      renderProfiles();
      if (itemProfileSelect) {
        itemProfileSelect.value = currentProfileDetail;
        itemProfileSelect.disabled = true;
      }
      itemModal.show();
      const onHidden = () => {
        if (itemProfileSelect) itemProfileSelect.disabled = false;
        itemModalEl.removeEventListener('hidden.bs.modal', onHidden);
        currentProfileDetail = currentProfileDetail;
      };
      itemModalEl.addEventListener('hidden.bs.modal', onHidden);
    });
  }
  if (profileDetailEditBtn) {
    profileDetailEditBtn.addEventListener('click', async () => {
      const oldName = currentProfileDetail;
      if (!oldName) return;
      const nextName = prompt('New profile name', oldName) || '';
      const name = String(nextName).trim();
      if (!name || name === oldName) return;
      const profiles = getProfiles();
      const exists = profiles.find(p => p.name === name);
      if (exists) { alert('Profile with this name already exists'); return; }
      const updated = profiles.map(p => p.name===oldName ? { ...p, name } : p);
      saveProfiles(updated);
      const data = getContentSync();
      data.items = (data.items || []).map(it => String(it.profile||'')===oldName ? { ...it, profile: name } : it);
      saveContent(data);
      currentProfileDetail = name;
      renderProfiles();
      await refreshItems();
      const raw = localStorage.getItem('livehub_profiles');
      try {
        const arr = raw ? JSON.parse(raw) : [];
        const p = Array.isArray(arr) ? arr.find(x => x && x.name === name) : null;
        if (p && p.photo) { profileDetailAvatarEl.src = p.photo; profileDetailAvatarEl.style.display = 'inline-block'; } else { profileDetailAvatarEl.style.display = 'none'; }
      } catch { profileDetailAvatarEl.style.display = 'none'; }
      if (profileDetailTitleEl) profileDetailTitleEl.textContent = name;
    });
  }
  if (profileDetailDeleteBtn) {
    profileDetailDeleteBtn.addEventListener('click', async () => {
      const name = currentProfileDetail;
      if (!name) return;
      if (!confirm('Delete profile "' + name + '" and all associated videos?')) return;
      const profiles = getProfiles().filter(p => p.name !== name);
      saveProfiles(profiles);
      const data = getContentSync();
      data.items = (data.items || []).filter(it => String(it.profile||'') !== name);
      saveContent(data);
      renderProfiles();
      await refreshItems();
      if (profileDetailModal) profileDetailModal.hide();
    });
  }
  if (profileDetailListEl) {
    profileDetailListEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit-profile-item') {
        const data = getContentSync();
        const item = (data.items || []).find(i => String(i.id) === String(id));
        if (!item) return;
        document.getElementById('itemId').value = item.id;
        renderProfiles();
        if (itemProfileSelect) {
          itemProfileSelect.value = currentProfileDetail || String(item.profile || '');
          itemProfileSelect.disabled = true;
        }
        document.getElementById('itemTitle').value = item.title || '';
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemVideo').value = item.link || item.video || '';
        document.getElementById('itemDuration').value = item.duration || '';
        if (itemCategorySelect) {
          const cats = getCategories();
          renderCategories();
          const val = cats.includes(String(item.category || '')) ? item.category : 'Uncategorized';
          itemCategorySelect.value = val || '';
        }
        const previewEl = document.getElementById('itemImagePreview');
        if (previewEl) {
          const img = item.thumbnail || item.image || '';
          if (img) { previewEl.src = img; previewEl.style.display = 'block'; } else { previewEl.src = ''; previewEl.style.display = 'none'; }
        }
        if (itemModal) itemModal.show();
        const onHidden = () => { if (itemProfileSelect) itemProfileSelect.disabled = false; itemModalEl.removeEventListener('hidden.bs.modal', onHidden); };
        itemModalEl.addEventListener('hidden.bs.modal', onHidden);
      } else if (action === 'delete-profile-item') {
        if (!confirm('Delete this item?')) return;
        const data = getContentSync();
        data.items = (data.items || []).filter(i => String(i.id) !== String(id));
        saveContent(data);
        await refreshItems();
        const listData = getContentSync();
        const listItems = (listData.items || []).filter(i => String(i.profile||'') === currentProfileDetail);
        if (profileDetailCountEl) profileDetailCountEl.textContent = `${listItems.length} ${listItems.length===1?'video':'videos'}`;
        if (profileDetailListEl) {
          profileDetailListEl.innerHTML = '';
          listItems.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6';
            const img = item.thumbnail || item.image || '';
            col.innerHTML = `
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">${item.title || ''}</h5>
                  <div class="d-flex align-items-center gap-2 mb-2">
                    ${img ? `<img src="${img}" alt="" style="width:56px;height:56px;border-radius:8px;object-fit:cover;">` : ''}
                    <div class="small text-muted">Category: ${item.category || '—'}</div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" data-action="edit-profile-item" data-id="${item.id}">Edit</button>
                    <button class="btn btn-secondary btn-sm" data-action="delete-profile-item" data-id="${item.id}">Delete</button>
                  </div>
                </div>
              </div>
            `;
            profileDetailListEl.appendChild(col);
          });
        }
      }
    });
  }
});

async function refreshItems() {
  const data = await getInitialContent();
  itemsList.innerHTML = '';
  (data.items || []).forEach(item => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${item.title || ''}</h5>
          <p class="card-text">${item.description || ''}</p>
          <div class="small text-muted">Category: ${item.category || '—'}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${item.id}">Edit</button>
            <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
    itemsList.appendChild(col);
  });
}

document.getElementById('saveItemBtn').addEventListener('click', async () => {
  const id = document.getElementById('itemId').value;
  const payload = {
    profile: itemProfileSelect ? String(itemProfileSelect.value || '') : '',
    title: document.getElementById('itemTitle').value.trim(),
    description: document.getElementById('itemDescription').value.trim(),
    link: document.getElementById('itemVideo').value.trim(),
    duration: document.getElementById('itemDuration').value.trim(),
    category: itemCategorySelect ? String(itemCategorySelect.value || '') : ''
  };
  if (!isSessionValid()) { window.location.href = '/'; return; }
  function normalizeLink(url) {
    if (!url) return null;
    let u;
    try { u = new URL(url); } catch { return null; }
    const host = (u.hostname || '').replace(/^www\./,'').toLowerCase();
    const path = (u.pathname || '');
    const ext = path.toLowerCase();
    if (ext.endsWith('.mp4')) return { type: 'stream', src: url, provider: 'mp4' };
    if (ext.endsWith('.m3u8')) return { type: 'stream', src: url, provider: 'hls' };
    if (host === 'youtu.be') {
      const vid = path.replace('/','');
      if (vid) return { type: 'embed', src: `https://www.youtube.com/embed/${vid}?modestbranding=1&rel=0&showinfo=0`, provider: 'youtube' };
      return null;
    }
    if (host.endsWith('youtube.com')) {
      const vid = u.searchParams.get('v');
      if (vid) return { type: 'embed', src: `https://www.youtube.com/embed/${vid}?modestbranding=1&rel=0&showinfo=0`, provider: 'youtube' };
      const m = path.match(/\/embed\/([A-Za-z0-9_-]+)/);
      if (m && m[1]) return { type: 'embed', src: `https://www.youtube.com/embed/${m[1]}?modestbranding=1&rel=0&showinfo=0`, provider: 'youtube' };
      return null;
    }
    if (host === 'drive.google.com') {
      const m = path.match(/\/file\/d\/([^/]+)/);
      if (m && m[1]) return { type: 'embed', src: `https://drive.google.com/file/d/${m[1]}/preview`, provider: 'gdrive' };
      const id = u.searchParams.get('id');
      if (id) return { type: 'embed', src: `https://drive.google.com/file/d/${id}/preview`, provider: 'gdrive' };
      return null;
    }
    if (host === 'u.pcloud.link' || host.endsWith('pcloud.com') || host.endsWith('pcloud.link')) {
      const code = u.searchParams.get('code');
      if ((path || '').includes('/publink/show') && code) {
        const direct = `https://u.pcloud.link/publink/download?code=${code}`;
        return { type: 'stream', src: direct, provider: 'pcloud' };
      }
      if (ext.endsWith('.mp4')) return { type: 'stream', src: url, provider: 'pcloud' };
      if (ext.endsWith('.m3u8')) return { type: 'stream', src: url, provider: 'pcloud' };
    }
    // Known embed endpoints kept as-is
    if (host === 'player.vimeo.com' && path.startsWith('/video/')) return { type: 'embed', src: url, provider: 'vimeo' };
    if (host.endsWith('dailymotion.com') && path.startsWith('/embed/video/')) return { type: 'embed', src: url, provider: 'dailymotion' };
    if (host.endsWith('pornhub.com') && (path.startsWith('/embed/') || u.searchParams.has('viewkey'))) return { type: 'embed', src: url, provider: 'pornhub' };
    if (host.endsWith('xvideos.com') && path.startsWith('/embedframe/')) return { type: 'embed', src: url, provider: 'xvideos' };
    if (host.endsWith('xnxx.com') && path.startsWith('/embedframe/')) return { type: 'embed', src: url, provider: 'xnxx' };
    if (host.endsWith('xhamster.com') && path.startsWith('/embed/')) return { type: 'embed', src: url, provider: 'xhamster' };
    return null;
  }
  const normalized = normalizeLink(payload.link);
  const videoErrorEl = document.getElementById('videoError');
  const durationStatusEl = document.getElementById('durationStatus');
  const saveBtn = document.getElementById('saveItemBtn');
  if (!normalized) {
    if (videoErrorEl) { videoErrorEl.classList.remove('d-none'); videoErrorEl.textContent = 'Playback not supported'; }
    return;
  } else {
    if (videoErrorEl) videoErrorEl.classList.add('d-none');
    payload.link = normalized.src;
  }
  const cats = getCategories();
  if (!payload.category || !cats.includes(payload.category)) {
    if (videoErrorEl) { videoErrorEl.classList.remove('d-none'); videoErrorEl.textContent = 'Please select a category'; }
    return;
  }
  if (!payload.profile) {
    payload.profile = 'General';
  }
  function convertToMMSS(s) {
    const sec = Math.max(0, Math.floor(Number(s) || 0));
    const m = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${m}:${ss < 10 ? '0' + ss : ss}`;
  }
  function getYoutubeId(url) {
    try {
      const u = new URL(url);
      const host = (u.hostname || '').replace(/^www\./,'');
      if (host === 'youtu.be') return u.pathname.replace('/','');
      if (host.endsWith('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const m = (u.pathname || '').match(/\/embed\/([A-Za-z0-9_-]+)/);
        if (m && m[1]) return m[1];
      }
      if (host.endsWith('youtube-nocookie.com')) {
        const m = (u.pathname || '').match(/\/embed\/([A-Za-z0-9_-]+)/);
        if (m && m[1]) return m[1];
      }
      return '';
    } catch { return ''; }
  }
  async function loadYTAPI() {
    if (window.YT && window.YT.Player) return;
    await new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      const check = () => {
        if (window.YT && window.YT.Player) resolve();
        else setTimeout(check, 250);
      };
      check();
    });
  }
  async function detectYoutubeDuration(id) {
    if (!id) return null;
    try {
      const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}`);
      if (r.ok) {
        const j = await r.json();
        if (j && j.duration) return convertToMMSS(Number(j.duration));
      }
    } catch {}
    try {
      await loadYTAPI();
      return await new Promise((resolve) => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;overflow:hidden;';
        document.body.appendChild(probe);
        let player;
        const finish = (val) => {
          try { player && player.destroy(); } catch {}
          probe.remove();
          resolve(val);
        };
        player = new YT.Player(probe, {
          videoId: id,
          events: {
            onReady: () => {
              try {
                const d = player.getDuration();
                if (d && isFinite(d)) finish(convertToMMSS(Math.round(d)));
                else finish(null);
              } catch { finish(null); }
            }
          }
        });
        setTimeout(() => finish(null), 8000);
      });
    } catch { return null; }
  }
  async function detectMp4Duration(src) {
    return await new Promise((resolve) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = src;
      v.muted = true;
      const cleanup = () => { try { v.remove(); } catch {} };
      v.onloadedmetadata = () => { const d = v.duration; cleanup(); resolve(d && isFinite(d) ? convertToMMSS(d) : null); };
      v.onerror = () => { cleanup(); resolve(null); };
      setTimeout(() => { cleanup(); resolve(null); }, 8000);
      document.body.appendChild(v);
    });
  }
  async function detectDuration(link) {
    try {
      if (payload.duration) return payload.duration;
      const u = new URL(link);
      const p = (u.pathname || '').toLowerCase();
      const h = (u.hostname || '').replace(/^www\./,'').toLowerCase();
      if (p.endsWith('.mp4')) {
        const val = await detectMp4Duration(link);
        if (val) return val;
      } else if (h.includes('youtube') || h === 'youtu.be' || h.includes('youtube-nocookie')) {
        const id = getYoutubeId(link);
        const val = await detectYoutubeDuration(id);
        if (val) return val;
      }
      return 'Live';
    } catch { return 'Live'; }
  }
  if (durationStatusEl) durationStatusEl.classList.remove('d-none');
  if (saveBtn) saveBtn.disabled = true;
  const detected = await detectDuration(payload.link);
  payload.duration = detected || 'Live';
  if (durationStatusEl) durationStatusEl.classList.add('d-none');
  if (saveBtn) saveBtn.disabled = false;
  async function readFileAsDataURL(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  const fileInput = document.getElementById('itemImageFile');
  const previewEl = document.getElementById('itemImagePreview');
  let imageData = '';
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const f = fileInput.files[0];
    if (!['image/jpeg','image/png'].includes(f.type)) {
      alert('Please upload a JPG or PNG image');
      return;
    }
    imageData = await readFileAsDataURL(f);
  } else if (previewEl && previewEl.src) {
    imageData = previewEl.src;
  }
  payload.thumbnail = imageData;
  if (!payload.title || !payload.link || !payload.thumbnail) {
    if (videoErrorEl) { videoErrorEl.classList.remove('d-none'); videoErrorEl.textContent = 'Please add title, link and thumbnail'; }
    return;
  }
  if (await functionsAvailable()) {
    if (!id) { await apiPost('add', payload); } else { await apiPost('update', { id, ...payload }); }
  } else {
    const data = getContentSync();
    const items = Array.isArray(data.items) ? data.items : [];
    if (!id) {
      const maxId = items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0);
      const newItem = { id: maxId + 1, createdAt: Date.now(), ...payload };
      data.items = [...items, newItem];
    } else {
      data.items = items.map(it => String(it.id) === String(id) ? { id: it.id, createdAt: it.createdAt || Date.now(), ...payload } : it);
    }
    saveContent(data);
  }
  if (itemModal) itemModal.hide();
  await refreshItems();
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  if (fileInput) fileInput.value = '';
  if (previewEl) { previewEl.src=''; previewEl.style.display='none'; }
});

itemsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if (action === 'edit') {
    const data = getContentSync();
    const item = (data.items || []).find(i => String(i.id) === String(id));
    if (!item) return;
    document.getElementById('itemId').value = item.id;
    renderProfiles();
    if (itemProfileSelect) {
      const val = String(item.profile || '');
      itemProfileSelect.value = val;
    }
    document.getElementById('itemTitle').value = item.title || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemVideo').value = item.link || item.video || '';
    document.getElementById('itemDuration').value = item.duration || '';
    if (itemCategorySelect) {
      const cats = getCategories();
      renderCategories();
      renderCategorySelect();
      const val = cats.includes(String(item.category || '')) ? item.category : 'Uncategorized';
      itemCategorySelect.value = val || '';
    }
    const previewEl = document.getElementById('itemImagePreview');
    if (previewEl) {
      const img = item.thumbnail || item.image || '';
      if (img) {
        previewEl.src = img;
        previewEl.style.display = 'block';
      } else {
        previewEl.src = '';
        previewEl.style.display = 'none';
      }
    }
    if (itemModal) itemModal.show();
  } else if (action === 'delete') {
    if (!confirm('Delete this item?')) return;
    if (!isSessionValid()) { window.location.href = '/'; return; }
    if (await functionsAvailable()) {
      await apiPost('delete', { id });
    } else {
      const data = getContentSync();
      data.items = (data.items || []).filter(i => String(i.id) !== String(id));
      saveContent(data);
    }
    await refreshItems();
  }
});

const imageFileInput = document.getElementById('itemImageFile');
if (imageFileInput) {
  imageFileInput.addEventListener('change', async () => {
    const file = imageFileInput.files && imageFileInput.files[0];
    const previewEl = document.getElementById('itemImagePreview');
    if (!file) { if (previewEl) { previewEl.src=''; previewEl.style.display='none'; } return; }
    if (!['image/jpeg','image/png'].includes(file.type)) {
      alert('Please upload a JPG or PNG image');
      imageFileInput.value = '';
      if (previewEl) { previewEl.src=''; previewEl.style.display='none'; }
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (previewEl) { previewEl.src = e.target.result; previewEl.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
  });
}
})();
