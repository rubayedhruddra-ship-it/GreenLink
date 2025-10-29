(function(){
  'use strict';

  const headerEl = document.getElementById('profileHeader');
  const editSec = document.getElementById('editProfileSection');
  const passSec = document.getElementById('passwordSection');

  // --- helpers ---
  function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }
  function escapeHtmlAttr(s){
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // Safe fetch that returns parsed JSON or error
  async function apiGet(url) {
    try {
      const r = await fetch(url, { credentials: 'same-origin' });
      const text = await r.text();
      try { return JSON.parse(text); }
      catch(e) { return { error: 'Invalid JSON from ' + url }; }
    } catch (err) {
      return { error: 'Network error' };
    }
  }

  function el(html){
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  async function loadProfile(){
    const id = window.VIEW_USER_ID;
    if (!id) {
      headerEl.innerHTML = '<div class="loading-fallback"><p>User not found</p></div>';
      return;
    }

    const [profileRes, currentRes] = await Promise.all([
      apiGet('api/profile.php?id=' + encodeURIComponent(id)),
      apiGet('api/current_user.php')
    ]);

    if (profileRes.error) {
      headerEl.innerHTML = `<div class="loading-fallback"><p>${escapeHtml(profileRes.error)}</p></div>`;
      return;
    }

    const p = profileRes.profile || {};
    const current = (currentRes && currentRes.user) ? currentRes.user : null;
    const isOwn = current && String(current.id) === String(id);

    renderHeader(p, isOwn);
    if (isOwn) {
      renderEditProfile(p);
      renderPasswordForm();
    }
  }

  function renderHeader(p, isOwn) {
    headerEl.innerHTML = '';

    let avatarUrl = 'IMG/user.png';
    if (p.avatar && String(p.avatar).trim() !== '') {
      if (String(p.avatar).startsWith('data:')) avatarUrl = p.avatar;
      else avatarUrl = 'uploads/' + p.avatar;
    }

    const node = el(`
      <div class="header-card-content">
        <div class="avatar-wrap">
          <img src="${avatarUrl}" alt="avatar" id="avatarImage">
        </div>
        <div class="profile-right">
          <div class="profile-meta">
            <h2>${escapeHtml(p.name || 'Unnamed User')}</h2>
            <div class="username">@${escapeHtml(p.username || 'unknown')}</div>
            <div class="bio">${escapeHtml(p.bio || 'No bio added yet.')}</div>
          </div>
          ${isOwn ? `
          <div class="avatar-action">
            <label class="btn btn--primary" for="avatarInput">Upload Profile Picture</label>
            <input type="file" id="avatarInput" accept="image/*" style="display:none;">
          </div>` : ''}
        </div>
      </div>
    `);

    headerEl.appendChild(node);
    
    const avatarImg = document.getElementById('avatarImage');
    if (avatarImg) {
      const wrap = avatarImg.closest('.avatar-wrap');
      if (wrap) wrap.style.backgroundImage = `url(${avatarImg.src})`;
    }

    if (isOwn) {
      const input = document.getElementById('avatarInput');
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target.result;
          const avatarImg = document.getElementById('avatarImage');
          avatarImg.src = dataUrl;
          const wrap = avatarImg.closest('.avatar-wrap');
          if (wrap) wrap.style.backgroundImage = `url(${dataUrl})`;

          try {
            const res = await fetch('api/profile.php', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatar: dataUrl })
            });
            const j = await res.json();
            if (j.success) alert('Profile picture updated!');
            else alert(j.error || 'Failed to update picture');
          } catch (err) {
            alert('Network error while uploading image');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function renderEditProfile(p) {
    if (!editSec) return;
    editSec.style.display = 'block';
    editSec.innerHTML = `
      <h3>Edit Profile</h3>
      <form id="editForm">
        <div class="field"><span>Name</span><input name="name" value="${escapeHtmlAttr(p.name||'')}"></div>
        <div class="field"><span>Username</span><input name="username" value="${escapeHtmlAttr(p.username||'')}"></div>
        <div class="field"><span>Bio</span><textarea name="bio">${escapeHtml(p.bio||'')}</textarea></div>
        <button class="btn btn--primary" id="saveProfile">Save Changes</button>
      </form>
    `;

    const saveBtn = document.getElementById('saveProfile');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const form = document.getElementById('editForm');
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const r = await fetch('api/profile.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const j = await r.json();
        if (j.success) { alert('Profile updated successfully'); location.reload(); }
        else alert(j.error || 'Error updating profile');
      } catch (err) {
        alert('Network error updating profile');
      }
    });
  }

  function renderPasswordForm() {
    if (!passSec) return;
    passSec.style.display = 'block';
    passSec.innerHTML = `
      <h3>Change Password</h3>
      <form id="passForm">
        <div class="field password-wrapper">
          <span>Current Password</span>
          <input type="password" name="current" id="currentPass" required>
          <i class="fa-solid fa-eye eye-toggle" data-target="currentPass" title="Show/Hide password"></i>
        </div>
        <div class="field password-wrapper">
          <span>New Password</span>
          <input type="password" name="new" id="newPass" required>
          <i class="fa-solid fa-eye eye-toggle" data-target="newPass" title="Show/Hide password"></i>
        </div>
        <button class="btn btn--primary" id="changePass">Update Password</button>
      </form>
    `;

    document.querySelectorAll('.eye-toggle').forEach(icon => {
      icon.addEventListener('click', () => {
        const target = document.getElementById(icon.dataset.target);
        if (!target) return;
        target.type = target.type === 'password' ? 'text' : 'password';
        if (icon.classList.contains('fa-eye')) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });

    const changeBtn = document.getElementById('changePass');
    if (!changeBtn) return;
    changeBtn.addEventListener('click', async (e)=>{
      e.preventDefault();
      const form = document.getElementById('passForm');
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const r = await fetch('api/change_password.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const j = await r.json();
        if (j.success) { alert('Password updated successfully'); form.reset(); }
        else alert(j.error || 'Error changing password');
      } catch (err) {
        alert('Network error while changing password');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', loadProfile);
})();
