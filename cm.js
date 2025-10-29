(() => {
  'use strict';

  // Logged-in user (populated from server)
  let CURRENT_USER = { id: null, username: 'Guest', name: 'Guest', avatar: 'IMG/user.png' };

  // DOM helpers
  const $ = (sel, root = document) => root ? root.querySelector(sel) : null;
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

  // Elements
  const feedEl = $('#feed');
  const postText = $('#postText');
  const imgInput = $('#imgInput');
  const imgPreview = $('#imgPreview');
  const postBtn = $('#postBtn');
  const composerAvatar = $('#composerAvatar') || document.querySelector('.composer-body .avatar');

  let state = { posts: [] };
  let pendingImageData = '';

  const uid = () => 'local_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // new: human friendly relative time (used under username)
  const timeAgo = (iso) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    let s = Math.floor((Date.now() - t) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return s + 's';
    let m = Math.floor(s / 60);
    if (m < 60) return m + 'm';
    let h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    let d = Math.floor(h / 24);
    if (d < 30) return d + 'd';
    let mo = Math.floor(d / 30);
    if (mo < 12) return mo + 'mo';
    let y = Math.floor(d / 365);
    return y + 'y';
  };

  // Build profile link - own post -> profile.php, other -> profile view (by id if available, otherwise username)
  function profileLinkFor(userId, username) {
    const uname = String(username || '');
    if (!userId && uname && uname === (CURRENT_USER.username || '')) return 'profile.php';
    if (userId && String(userId) === String(CURRENT_USER.id)) return 'profile.php';
    if (userId) return 'profile.php?id=' + encodeURIComponent(userId);
    // fallback to username query
    return 'profile.php?username=' + encodeURIComponent(uname || '');
  }

  async function apiCurrentUser() {
    try {
      const res = await fetch('api/current_user.php', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return null;
      const j = await res.json();
      return j && j.user ? j.user : null;
    } catch (e) { return null; }
  }

  async function apiFetchPosts() {
    try {
      const res = await fetch('api/posts.php', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? j : (j.posts || []);
    } catch (e) { return []; }
  }

  async function apiCreatePost(content, imageData) {
    // send JSON with possible base64 image
    try {
      const res = await fetch('api/posts.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content || '', image: imageData || '' })
      });
      return await res.json();
    } catch (e) {
      // fallback to multipart (file upload)
    }
    try {
      const fd = new FormData();
      fd.append('content', content || '');
      if (imageData && imageData.startsWith('data:')) {
        // convert dataURL -> blob
        const parts = imageData.split(',');
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8 = new Uint8Array(n);
        while (n--) u8[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8], { type: parts[0].match(/:(.*?);/)[1] });
        fd.append('image', blob, 'photo.png');
      }
      const r2 = await fetch('api/posts.php', { method: 'POST', credentials: 'same-origin', body: fd });
      return await r2.json();
    } catch (e) { return { success: false, error: e.message || 'Network error' }; }
  }

  async function apiPostAction(action, id, body = {}) {
    try {
      const url = `api/posts.php?action=${encodeURIComponent(action)}&id=${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      return await res.json();
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function apiDeletePost(id) {
    try {
      const res = await fetch('api/posts.php?id=' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' });
      return await res.json();
    } catch (e) { return { success: false, error: e.message }; }
  }

  // render helpers (kept simple)
  function renderPosts(posts) {
    state.posts = posts || [];
    if (!feedEl) return;
    feedEl.innerHTML = state.posts.length
      ? state.posts.map(p => postCardHTML(p)).join('\n')
      : '<p class="card">No posts yet — be the first to share!</p>';
    // update avatars in composer
    $$('.add-comment img', feedEl).forEach(img => img.src = CURRENT_USER.avatar || 'IMG/user.png');
  }

  function postCardHTML(p) {
    const id = p.id || uid();
    const usernameRaw = p.username || p.user || 'Guest';
    const username = escapeHtml(usernameRaw);
    const avatar = p.avatar ? escapeHtml(p.avatar) : 'IMG/user.png';
    const content = escapeHtml(p.content || '');
    const imageTag = p.image ? `<div class="post-img"><img src="${escapeHtml(p.image)}" alt="post image" style="width:100%;height:auto;object-fit:cover"></div>` : '';
    const likes = (p.likes_count || (p.likes && p.likes.length) || 0);
    const comments = p.comments || [];
    const commentsCount = comments.length || (p.comments_count || 0);
    const isOwner = (CURRENT_USER && ((p.user_id && String(p.user_id) === String(CURRENT_USER.id)) || (String(usernameRaw) === String(CURRENT_USER.username))));
    const likedClass = p.liked ? 'liked' : '';

    const profileHref = profileLinkFor(p.user_id ?? null, usernameRaw);

    return `
      <article class="card post" data-id="${id}">
        <div class="post-head" style="display:flex;align-items:center;gap:.7rem">
          <a href="${profileHref}" class="author-link" style="display:flex;align-items:center;gap:.7rem;text-decoration:none;color:inherit">
            <img class="avatar" src="${avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" alt="${username}">
            <div class="author-info">
              <strong>${username}</strong>
              <small style="display:block;opacity:.7;margin-top:2px">Posted ${timeAgo(p.created_at)}</small>
            </div>
          </a>
          <div style="margin-left:auto">
            ${isOwner ? `<button class="btn" data-action="delete" data-id="${id}" title="Delete post">🗑️</button>` : ''}
          </div>
        </div>
        <div class="post-content" style="margin-top:.6rem"><p>${content}</p>${imageTag}</div>
        <div class="post-actions" style="display:flex;gap:1.2rem;margin-top:.8rem;align-items:center">
          <button class="action ${likedClass}" data-action="like" data-id="${id}">❤ <span class="likes-count">${likes}</span></button>
          <button class="action" data-action="focus-comment" data-id="${id}">💬 <strong>${commentsCount}</strong></button>
        </div>
        <div class="comments" data-id="${id}" style="margin-top:.6rem">
          ${renderCommentsPreviewHtml(id, comments)}
        </div>
        <div class="add-comment" style="margin-top:.6rem;display:flex;gap:.6rem;align-items:center;">
          <img src="${CURRENT_USER.avatar || 'IMG/user.png'}" style="width:34px;height:34px;border-radius:50%;object-fit:cover" alt="you">
          <input class="comment-input" data-id="${id}" placeholder="Write a comment…" aria-label="Write a comment" style="flex:1;padding:.6rem;border-radius:8px;border:1px solid rgba(255,255,255,.04);background:transparent;color:inherit">
          <button class="btn" data-action="comment" data-id="${id}">Send</button>
        </div>
      </article>
    `;
  }

  function renderCommentsPreviewHtml(postId, comments = []) {
    if (!comments || comments.length === 0) return '';
    const maxPreview = 3;
    const list = comments.slice(0, maxPreview);
    return list.map(c => {
      const avatar = c.avatar || 'IMG/user.png';
      const userRaw = c.user || c.username || 'User';
      const user = escapeHtml(userRaw);
      const text = escapeHtml(c.text || c.comment || '');
      const href = profileLinkFor(c.user_id ?? null, userRaw);
      return `<div class="comment" style="display:flex;gap:.6rem;align-items:flex-start;margin-top:.5rem">
        <a href="${href}" style="text-decoration:none;color:inherit"><img class="avatar" src="${avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" alt="${user}"></a>
        <div style="flex:1"><strong><a href="${href}" style="text-decoration:none;color:inherit">${user}</a></strong><div style="margin-top:.25rem">${text}</div></div>
      </div>`;
    }).join('');
  }

  // reload posts from server and re-render
  async function reloadPosts() {
    const posts = await apiFetchPosts();
    // mark liked state (client side) based on CURRENT_USER
    const userId = CURRENT_USER && CURRENT_USER.id ? String(CURRENT_USER.id) : null;
    const username = CURRENT_USER && CURRENT_USER.username ? String(CURRENT_USER.username) : null;
    const mapped = (posts || []).map(p => {
      p.liked = Array.isArray(p.likes) && ((userId && p.likes.some(l => l.user_id && String(l.user_id) === userId)) || (!userId && username && p.likes.some(l => l.username === username)));
      return p;
    });
    renderPosts(mapped);
  }

  // image preview handling
  if (imgInput) imgInput.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) { pendingImageData = ''; if (imgPreview) imgPreview.innerHTML = ''; return; }
    const r = new FileReader();
    r.onload = () => { pendingImageData = r.result; if (imgPreview) imgPreview.innerHTML = `<img src="${pendingImageData}" style="width:100%;height:auto;object-fit:cover">`; };
    r.readAsDataURL(f);
  });

  // create post (simple: send -> reload)
  if (postBtn) postBtn.addEventListener('click', async () => {
    const content = (postText && postText.value || '').trim();
    if (!content && !pendingImageData) { alert('Write something or add a photo.'); return; }
    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';

    const res = await apiCreatePost(content, pendingImageData);
    postBtn.disabled = false;
    postBtn.textContent = 'Post';

    if (!res || res.error || !res.success) {
      alert('Could not create post: ' + (res && res.error ? res.error : 'Server error'));
      return;
    }

    // clear inputs and reload authoritative posts
    if (postText) postText.value = '';
    pendingImageData = '';
    if (imgPreview) imgPreview.innerHTML = '';
    await reloadPosts();
  });

  // delegated actions
  if (feedEl) feedEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'delete') {
      if (!confirm('Delete this post?')) return;
      const res = await apiDeletePost(id);
      if (!res || res.error || !res.success) return alert('Delete failed: ' + (res && res.error ? res.error : 'Server error'));
      await reloadPosts();
      return;
    }

    if (action === 'like') {
      const res = await apiPostAction('like', id);
      if (!res || res.error || !res.success) return alert('Like failed: ' + (res && res.error ? res.error : 'Server error'));
      await reloadPosts();
      return;
    }

    if (action === 'comment') {
      const input = feedEl.querySelector(`.comment-input[data-id="${id}"]`);
      if (!input) return;
      const text = (input.value || '').trim();
      if (!text) return;
      const res = await apiPostAction('comment', id, { comment: text });
      if (!res || res.error || !res.success) return alert('Comment failed: ' + (res && res.error ? res.error : 'Server error'));
      input.value = '';
      await reloadPosts();
      return;
    }

    if (action === 'focus-comment') {
      const input = feedEl.querySelector(`.comment-input[data-id="${id}"]`);
      if (input) input.focus();
      return;
    }
  });

  // init
  (async function init(){
    const user = await apiCurrentUser();
    if (user) {
      CURRENT_USER = {
        id: user.id ?? user.user_id ?? null,
        username: user.username || user.name || 'User',
        name: user.name || user.username || 'User',
        avatar: user.avatar ? (String(user.avatar).startsWith('http') ? user.avatar : ('uploads/' + user.avatar)) : (user.avatar_url || 'IMG/user.png')
      };
    }
    if (composerAvatar) composerAvatar.src = CURRENT_USER.avatar || 'IMG/user.png';
    await reloadPosts();
  })();
})();