(() => {
  'use strict';
  const $ = (sel, root = document) => (root || document).querySelector(sel);
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));
  const uid = () => 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);


  let tabs, panes;
  let searchInput, clearSearch;
  let itemsGrid, formTitle, formCategory, formCondition, formDescription, imgInput, imgPreview, createBtn;
  let myRequestsList, incomingRequestsList;
  let modalRequest, modalItemTitle, modalOffered, modalEmail, modalPhone, modalMessage, sendRequestBtn;
  let modalApprove, approveInfo, approveEmail, approvePhone, confirmApprove;


  document.addEventListener('DOMContentLoaded', () => {
    tabs = $$('.tab-btn');
    panes = $$('.tab-pane');

    searchInput = $('#searchGlobal');
    clearSearch = $('#clearSearch');

    itemsGrid = $('#itemsGrid');
    formTitle = $('#title');
    formCategory = $('#category');
    formCondition = $('#condition');
    formDescription = $('#description');
    imgInput = $('#image');
    imgPreview = $('#imgPreview');
    createBtn = $('#createBtn');

    myRequestsList = $('#myRequestsList');
    incomingRequestsList = $('#incomingRequestsList');

    modalRequest = $('#modalRequest');
    modalItemTitle = $('#modalItemTitle');
    modalOffered = $('#modalOffered');
    modalEmail = $('#modalEmail');
    modalPhone = $('#modalPhone');
    modalMessage = $('#modalMessage');
    sendRequestBtn = $('#sendRequest');

    modalApprove = $('#modalApprove');
    approveInfo = $('#approveInfo');
    approveEmail = $('#approveEmail');
    approvePhone = $('#approvePhone');
    confirmApprove = $('#confirmApprove');

    if (typeof init === 'function') init();
  });

  const ITEMS_KEY = 'gl.swap.items.v1';
  const USER_KEY = 'gl.swap.user.v1';
  const API = 'api/swaps.php';

  let items = [];
  let currentUser = null;
  let selectedItem = null;
  let selectedRequest = null;

  async function apiCurrentUser(){
    try {
      const r = await fetch('api/current_user.php', { credentials:'same-origin', cache:'no-store' });
      if (!r.ok) return null;
      const j = await r.json();
      return j && j.user ? j.user : null;
    } catch(e){ return null; }
  }

  async function loadItems(){
    try {
      const r = await fetch(API, { credentials:'same-origin', cache:'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.items)) { items = j.items; persist(); renderAll(); return; }
      }
    } catch(e){}
    try { items = JSON.parse(localStorage.getItem(ITEMS_KEY)) || []; } catch(e){ items = []; }
    renderAll();
  }

  function persist(){ try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); } catch(e){} }


  async function init(){
    currentUser = await apiCurrentUser();
    if (currentUser) localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    else {
      const u = localStorage.getItem(USER_KEY);
      currentUser = u ? JSON.parse(u) : { id: null, username: 'Guest', avatar: 'IMG/user.png' };
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    }
    wireUI();
    await loadItems();
    if (window.feather) { try { feather.replace(); } catch(e){} }
  }

  function wireUI(){
    tabs.forEach(btn => btn.addEventListener('click', () => {
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      panes.forEach(p => p.classList.remove('active'));
      const pane = document.getElementById('tab-' + tab);
      if (pane) pane.classList.add('active');
      renderAll();
    }));

    if (searchInput) searchInput.addEventListener('input', () => renderItems(searchInput.value.trim().toLowerCase()));
    clearSearch?.addEventListener('click', () => { if (searchInput) searchInput.value = ''; renderItems(''); });

    imgInput?.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) { imgPreview.innerHTML = ''; return; }
      const r = new FileReader();
      r.onload = () => imgPreview.innerHTML = `<img src="${r.result}" alt="preview">`;
      r.readAsDataURL(f);
    });

    createBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const title = (formTitle?.value || '').trim();
      if (!title) return alert('Title required');
      createBtn.disabled = true;
      let imgData = '';
      const file = imgInput?.files && imgInput.files[0];
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', (formCategory?.value || '').trim());
      fd.append('condition', (formCondition?.value || '').trim());
      fd.append('description', (formDescription?.value || '').trim());
      if (file) fd.append('image', file);

      // try server API create
      let serverOk = false;
      try {
        const res = await fetch(API, { method:'POST', body: fd, credentials:'same-origin' });
        const json = await res.json();
        if (res.ok && !json.error) {
          serverOk = true;
          if (Array.isArray(json.items)) items = json.items;
        }
      } catch(e){ serverOk = false; }

      if (!serverOk) {
        if (file) {
          try { imgData = await fileToDataURL(file); } catch(e){ imgData = ''; }
        }
        const post = {
          id: uid(),
          title,
          category: (formCategory?.value || '').trim(),
          condition: (formCondition?.value || '').trim(),
          description: (formDescription?.value || '').trim(),
          image: imgData,
          created_at: new Date().toISOString(),
          user_id: currentUser && currentUser.id ? currentUser.id : null,
          username: currentUser && (currentUser.username || currentUser.name) ? (currentUser.username || currentUser.name) : 'Guest',
          avatar: currentUser && (currentUser.avatar || '') ? currentUser.avatar : 'IMG/user.png',
          requests: []
        };
        items.unshift(post);
      }

      persist();
      renderAll();

      formTitle.value = ''; formCategory.value = ''; formCondition.value = ''; formDescription.value = '';
      imgInput.value = ''; imgPreview.innerHTML = '';
      createBtn.disabled = false;
      document.querySelector('.tab-btn[data-tab="list"]')?.click();
    });

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.close;
        if (target) closeModal(target);
      });
    });

    // ensure sendRequestBtn listener is attached after DOM is ready
    if (sendRequestBtn) {
      sendRequestBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        if (!selectedItem) return alert('No item selected');

        const offered = (modalOffered.value || '').trim();
        if (!offered) { modalOffered.focus(); return; }

        sendRequestBtn.disabled = true;

        const reqPayload = {
          requester_id: currentUser && currentUser.id ? currentUser.id : null,
          requester: currentUser && (currentUser.username || currentUser.name) ? (currentUser.username || currentUser.name) : 'Guest',
          offered,
          message: (modalMessage?.value || '').trim(),
          email: (modalEmail?.value || '').trim(),
          phone: (modalPhone?.value || '').trim(),
          created_at: new Date().toISOString()
        };

        let serverOk = false;
        try {
          // correct query string: ?action=request&id=...
          const res = await fetch(`${API}?action=request&id=${encodeURIComponent(selectedItem.id)}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload)
          });
          const j = await res.json();
          if (res.ok && !j.error) {
            serverOk = true;
            if (Array.isArray(j.items)) items = j.items;
          }
        } catch (err) {
          serverOk = false;
        }

        if (!serverOk) {
          const it = items.find(i => String(i.id) === String(selectedItem.id));
          if (!it.requests) it.requests = [];
          // ensure offline-created requests set status to pending so owner can Accept/Reject
          it.requests.push(Object.assign({ id: uid(), status: 'pending' }, reqPayload));
        }

        persist();
        renderAll();
        closeModal('modalRequest');
        sendRequestBtn.disabled = false;
      });
    }

    confirmApprove?.addEventListener('click', async () => {
      const email = (approveEmail.value || '').trim();
      const phone = (approvePhone.value || '').trim();
      if (!selectedItem || !selectedRequest) return;

      // try server accept
      let serverOk = false;
      try {
        const res = await fetch(`${API}?action=accept&id=${encodeURIComponent(selectedItem.id)}`, {
          method:'POST', credentials:'same-origin',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ request_id: selectedRequest.id, contact_email: email, contact_phone: phone })
        });
        const j = await res.json();
        if (res.ok && !j.error) { serverOk = true; if (Array.isArray(j.items)) items = j.items; }
      } catch(e){ serverOk = false; }

      if (!serverOk) {
        const it = items.find(i => String(i.id) === String(selectedItem.id));
        if (!it || !it.requests) { closeModal('modalApprove'); return; }
        it.requests = it.requests.map(r => {
          if (String(r.id) === String(selectedRequest.id)) {
            return Object.assign({}, r, { status: 'accepted', contact: { email, phone } });
          }
          return r;
        });
      }

      persist();
      renderAll();
      closeModal('modalApprove');
    });
  }

  function fileToDataURL(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function openModal(id){ const m = document.getElementById(id); if (!m) return; m.classList.add('open'); m.setAttribute('aria-hidden','false'); }
  function closeModal(id){
    const m = document.getElementById(id); if (!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden','true');
    if (id === 'modalRequest') { modalOffered.value = ''; selectedItem = null; }
    if (id === 'modalApprove') { approveEmail.value = ''; approvePhone.value = ''; selectedRequest = null; selectedItem = null; }
  }

  function renderAll(){
    renderItems(searchInput?.value ? searchInput.value.trim().toLowerCase() : '');
    renderMyRequests();
    renderIncomingRequests();
  }

  function renderItems(q = '') {
    if (!itemsGrid) return;
    const query = (q || '').toLowerCase();
    const list = items.filter(it => {
      if (!query) return true;
      return (it.title||'').toLowerCase().includes(query) ||
             (it.description||'').toLowerCase().includes(query) ||
             (it.category||'').toLowerCase().includes(query) ||
             (it.username||'').toLowerCase().includes(query) ||
             (it.condition||'').toLowerCase().includes(query);
    });
    if (list.length === 0) {
      itemsGrid.innerHTML = `<div class="meta-small card">No items found.</div>`;
      return;
    }
    itemsGrid.innerHTML = list.map(it => {
      const isOwner = currentUser && ((it.user_id && String(it.user_id) === String(currentUser.id)) || (String(it.username) === String(currentUser.username)));
      const hasRequested = (it.requests || []).some(r => (currentUser && ((r.requester_id && String(r.requester_id) === String(currentUser.id)) || r.requester === (currentUser.username || currentUser.name))));
      const img = it.image ? `<img src="${escapeHtml(it.image)}" alt="">` : `<div style="height:140px;background:rgba(255,255,255,.02);border-radius:6px"></div>`;
      return `<div class="item-card card" data-id="${it.id}">
        <div class="item-thumb">${img}</div>
        <div style="display:flex;align-items:flex-start;gap:.6rem;flex-direction:column">
          <div style="flex:1">
            <strong class="item-title">${escapeHtml(it.title)}</strong><br>
            <small style="opacity:.7">${escapeHtml(it.username)} • ${new Date(it.created_at).toLocaleString()}</small>
          </div>
        </div>
        <div class="item-desc">${escapeHtml(it.description||'')}</div>
        <div class="item-meta">
          <span class="badge">${escapeHtml(it.category||'')}</span>
          <span class="badge">${escapeHtml(it.condition||'')}</span>
        </div>
        <div class="actions">
          ${isOwner ?
             `<button class="btn btn--ghost" data-action="delete" data-id="${it.id}">Delete</button>`
           : hasRequested ?
             `<button class="btn btn-requested" disabled>Requested</button>`
           : `<button class="btn btn--primary request-item" data-id="${it.id}">Request Swap</button>`}
        </div>
      </div>`;
    }).join('');
    $$('.request-item').forEach(b => b.addEventListener('click', onRequestClick));
    $$('.btn[data-action="delete"]').forEach(b => b.addEventListener('click', onDelete));
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function onDelete(e){
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this post?')) return;
    // try server delete
    let serverOk = false;
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, { method:'DELETE', credentials:'same-origin' });
      const j = await res.json();
      if (res.ok && !j.error) { serverOk = true; if (Array.isArray(j.items)) items = j.items; }
    } catch(e){ serverOk = false; }

    if (!serverOk) {
      items = items.filter(it => String(it.id) !== String(id));
      persist();
    } else {
      persist();
    }
    renderAll();
  }

  function onRequestClick(e){
    const id = e.currentTarget.dataset.id;
    selectedItem = items.find(it => String(it.id) === String(id));
    if (!selectedItem) return;
    modalItemTitle.textContent = selectedItem.title;
    // only show offered input now
    modalOffered.value = '';
    openModal('modalRequest');
    // focus first input for accessibility
    setTimeout(() => modalOffered.focus(), 120);
  }

  function onViewRequests(e){
    const id = e.currentTarget.dataset.id;
    const it = items.find(i => String(i.id) === String(id));
    if (!it) return;
    document.querySelector('.tab-btn[data-tab="requested"]')?.click();
    setTimeout(() => {
      const container = incomingRequestsList;
      container.innerHTML = '';
      container.appendChild(renderIncomingItemRequests(it));
      container.scrollIntoView({behavior:'smooth'});
    }, 80);
  }

  function renderIncomingItemRequests(item){
    const wrap = document.createElement('div');
    wrap.className = 'list-card';
    wrap.innerHTML = `<h4>${escapeHtml(item.title)} — Requests (${(item.requests||[]).length})</h4>`;
    if (!item.requests || item.requests.length === 0) {
      wrap.innerHTML += `<div class="meta-small">No requests</div>`;
      return wrap;
    }
    item.requests.forEach(r => {
      const rdiv = document.createElement('div');
      rdiv.className = 'req-row';
      rdiv.style.marginTop = '.5rem';
      rdiv.innerHTML = `<div style="flex:1">
          <strong>${escapeHtml(r.requester)}</strong> <small style="opacity:.7">• ${new Date(r.created_at).toLocaleString()}</small>
          <div>${escapeHtml(r.offered)}</div>
          <div style="opacity:.85">${escapeHtml(r.message||'')}</div>
          ${r.status ? `<small style="display:block;margin-top:.3rem">Status: ${escapeHtml(r.status)}</small>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:.4rem;align-items:flex-end">
          ${r.status === 'pending' ? `<button class="btn btn--primary accept-req" data-item="${escapeHtml(item.id)}" data-req="${escapeHtml(r.id)}">Accept</button>
           <button class="btn reject-req" data-item="${escapeHtml(item.id)}" data-req="${escapeHtml(r.id)}">Reject</button>` 
           : (r.status === 'accepted' ? `<div class="meta-small">Contact: ${escapeHtml((r.contact && r.contact.email) || r.email || 'N/A')} ${escapeHtml((r.contact && r.contact.phone) || r.phone || '')}</div>` : `<div class="meta-small">Rejected</div>`) }
        </div>`;
      wrap.appendChild(rdiv);
    });
    wrap.querySelectorAll('.accept-req').forEach(b => b.addEventListener('click', onAcceptClick));
    wrap.querySelectorAll('.reject-req').forEach(b => b.addEventListener('click', onRejectClick));
    return wrap;
  }

  function renderIncomingRequests(){
    if (!incomingRequestsList) return;
    const myItems = items.filter(it => currentUser && ((it.user_id && String(it.user_id) === String(currentUser.id)) || (String(it.username) === String(currentUser.username))));
    if (myItems.length === 0) { incomingRequestsList.innerHTML = `<div class="meta-small">You have no posts yet.</div>`; return; }
    incomingRequestsList.innerHTML = myItems.map(it => {
      const cnt = it.requests ? it.requests.length : 0;
      return `<div class="list-card"><h4>${escapeHtml(it.title)} <small style="opacity:.7">(${cnt})</small></h4>
        ${ (it.requests && it.requests.length) ? it.requests.map(r => {
          return `<div class="req-row" style="margin-top:.4rem">
            <div style="flex:1">
              <strong>${escapeHtml(r.requester)}</strong> <small style="opacity:.7">${new Date(r.created_at).toLocaleString()}</small>
              <div>${escapeHtml(r.offered)}</div>
              <div style="opacity:.85">${escapeHtml(r.message||'')}</div>
              ${r.status ? `<small style="display:block;margin-top:.3rem">Status: ${escapeHtml(r.status)}</small>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:.4rem;align-items:flex-end">
              ${ r.status === 'pending' ? `<button class="btn btn--primary accept-req" data-item="${escapeHtml(it.id)}" data-req="${escapeHtml(r.id)}">Accept</button>
                <button class="btn reject-req" data-item="${escapeHtml(it.id)}" data-req="${escapeHtml(r.id)}">Reject</button>` 
                : (r.status === 'accepted' ? `<div class="meta-small">Contact: ${escapeHtml((r.contact && r.contact.email) || r.email || 'N/A')} ${escapeHtml((r.contact && r.contact.phone) || r.phone || '')}</div>` : `<div class="meta-small">Rejected</div>`) }
            </div>
          </div>`;
        }).join('') : `<div class="meta-small">No requests</div>` }
      </div>`;
    }).join('');
    incomingRequestsList.querySelectorAll('.accept-req').forEach(b => b.addEventListener('click', onAcceptClick));
    incomingRequestsList.querySelectorAll('.reject-req').forEach(b => b.addEventListener('click', onRejectClick));
  }

  function renderMyRequests(){
    if (!myRequestsList) return;
    const mine = [];
    items.forEach(it => {
      (it.requests || []).forEach(r => {
        if ((currentUser && ((r.requester_id && String(r.requester_id) === String(currentUser.id)) || (r.requester === (currentUser.username || currentUser.name))))) {
          mine.push(Object.assign({}, r, { itemTitle: it.title, itemId: it.id }));
        }
      });
    });
    if (mine.length === 0) { myRequestsList.innerHTML = `<div class="meta-small">You have not requested any swaps.</div>`; return; }
    myRequestsList.innerHTML = mine.map(r => {
      return `<div class="list-card">
        <div style="display:flex;justify-content:space-between;gap:.6rem">
          <div style="flex:1"><strong>${escapeHtml(r.itemTitle)}</strong>
            <div>${escapeHtml(r.offered)}</div>
            <div style="opacity:.85">${escapeHtml(r.message||'')}</div>
            <small style="opacity:.7">${new Date(r.created_at).toLocaleString()}</small>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
            ${ r.status === 'accepted' ? `<div class="meta-small">Accepted — Contact: ${escapeHtml((r.contact && r.contact.email) || r.email || '')} ${escapeHtml((r.contact && r.contact.phone) || r.phone || '')}</div>` 
               : r.status === 'rejected' ? `<div class="meta-small">Rejected</div>`
               : `<div class="meta-small">Pending</div>`}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function onAcceptClick(e){
    const itemId = e.currentTarget.dataset.item;
    const reqId = e.currentTarget.dataset.req;
    selectedItem = items.find(i => String(i.id) === String(itemId));
    if (!selectedItem) return;
    selectedRequest = (selectedItem.requests || []).find(r => String(r.id) === String(reqId));
    if (!selectedRequest) return;
    approveInfo.textContent = `${selectedRequest.requester} requested "${selectedItem.title}" — provide contact details to share:`;
    openModal('modalApprove');
  }

  async function onRejectClick(e){
    const itemId = e.currentTarget.dataset.item;
    const reqId = e.currentTarget.dataset.req;
    if (!confirm('Reject this request?')) return;
    let serverOk = false;
    try {
      const res = await fetch(`api/swaps.php?action=reject&id=${encodeURIComponent(itemId)}`, {
        method:'POST', credentials:'same-origin',
        headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ request_id: reqId })
      });
      const j = await res.json();
      if (res.ok && !j.error) { serverOk = true; await loadItems(); }
    } catch(e){ serverOk = false; }

    if (!serverOk) {
      const it = items.find(i => String(i.id) === String(itemId));
      if (!it || !it.requests) return;
      it.requests = it.requests.map(r => (String(r.id) === String(reqId) ? Object.assign({}, r, { status: 'rejected' }) : r));
      persist();
      renderAll();
    }
  }

})();