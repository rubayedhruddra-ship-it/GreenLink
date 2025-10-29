document.addEventListener("DOMContentLoaded", async () => {

  if (window.feather && typeof feather.replace === 'function') feather.replace();

  // === ELEMENT REFERENCES (guarded where possible) ===
  const createProgramBtn = document.getElementById("createProgramBtn");
  const createEventBtn = document.getElementById("createEventBtn");

  const programsGrid = document.getElementById("programsGrid");
  const eventsGrid = document.getElementById("eventsGrid");

  const myProgramsGrid = document.getElementById("myProgramsGrid");
  const myEventsGrid = document.getElementById("myEventsGrid");
  const enrolledList = document.getElementById("enrolledList");

  const progImgInput = document.getElementById("progImgInput");
  const progImgPreview = document.getElementById("progImgPreview");
  const eventImgInput = document.getElementById("eventImgInput");
  const eventImgPreview = document.getElementById("eventImgPreview");

  // quick refs to required inputs for form state
  const progNameInput = document.getElementById('progName');
  const progCityInput = document.getElementById('progCity');
  const eventTitleInput = document.getElementById('eventTitle');
  const eventCityInput = document.getElementById('eventCity');

  const searchCity = document.getElementById("searchCity");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const chipButtons = document.querySelectorAll(".chip");

  const searchEventCity = document.getElementById("searchEventCity");
  const clearEventFiltersBtn = document.getElementById("clearEventFilters");


  // Determine current user: prefer server session via API, otherwise localStorage fallback
  let currentUser = null;
  let currentUserId = null;
  try {
    const res = await fetch('api/current_user.php', { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      if (j && j.user) {
        currentUser = j.user.username || j.user.name || 'Guest';
        currentUserId = j.user.id || null;
      }
    }
  } catch (err) { /* ignore */ }

  if (!currentUser) {
    // fallback to localStorage (use the same key everywhere)
    const s = localStorage.getItem('gl.recycle.user');
    currentUser = s || 'Guest';
  } else {
    // keep storing current user locally for internal logic
    localStorage.setItem('gl.recycle.user', currentUser);
  }

  // stable user key used for enrollments and per-user checks
  const userKey = currentUserId ? `uid:${currentUserId}` : `name:${currentUser}`;


  // Load saved data
  let programs = JSON.parse(localStorage.getItem("programs")) || [];
  let events = JSON.parse(localStorage.getItem("events")) || [];
  let enrollments = JSON.parse(localStorage.getItem("enrollments")) || [];

  // Normalize enrollment user identifiers to the stable userKey format
  enrollments = enrollments.map(en => {
    if (!en || !en.user) return en;
    if (typeof en.user === 'string' && (en.user.startsWith('uid:') || en.user.startsWith('name:'))) return en;
    return Object.assign({}, en, { user: `name:${en.user}` });
  });

  // helper to persist all data
  function persistAll() {
    localStorage.setItem("programs", JSON.stringify(programs));
    localStorage.setItem("events", JSON.stringify(events));
    localStorage.setItem("enrollments", JSON.stringify(enrollments));
  }

  // === IMAGE PREVIEWS ===
  if (progImgInput) progImgInput.addEventListener("change", (e) => previewImage(e, progImgPreview));
  if (eventImgInput) eventImgInput.addEventListener("change", (e) => previewImage(e, eventImgPreview));

  function previewImage(e, previewElement) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (previewElement) previewElement.innerHTML = `<img src="${reader.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }

  // Form state: enable post button only when required fields are populated
  function updateProgramFormState() {
    const ok = progNameInput && progCityInput && progNameInput.value.trim() && progCityInput.value.trim();
    if (createProgramBtn) createProgramBtn.disabled = !ok;
  }
  function updateEventFormState() {
    const ok = eventTitleInput && eventCityInput && eventTitleInput.value.trim() && eventCityInput.value.trim();
    if (createEventBtn) createEventBtn.disabled = !ok;
  }

  // attach input listeners for live validation (guard each)
  if (progNameInput) progNameInput.addEventListener('input', updateProgramFormState);
  if (progCityInput) progCityInput.addEventListener('input', updateProgramFormState);
  if (eventTitleInput) eventTitleInput.addEventListener('input', updateEventFormState);
  if (eventCityInput) eventCityInput.addEventListener('input', updateEventFormState);

  // initialize button states
  updateProgramFormState();
  updateEventFormState();

  // === CREATE PROGRAM ===
  if (createProgramBtn) createProgramBtn.addEventListener("click", () => {
    const name = document.getElementById("progName")?.value.trim() || "";
    const city = document.getElementById("progCity")?.value.trim() || "";
    const zip = document.getElementById("progZip")?.value.trim() || "";
    const address = document.getElementById("progAddress")?.value.trim() || "";
    const hours = document.getElementById("progHours")?.value.trim() || "";
    const phone = document.getElementById("progPhone")?.value.trim() || "";
    const website = document.getElementById("progWebsite")?.value.trim() || "";
    const mats = [...document.querySelectorAll(".prog-mat:checked")].map(c => c.value);

    if (!name || !city) {
      alert("Please fill in the required fields.");
      return;
    }

    const img = progImgPreview?.querySelector("img")?.src || "";

    const newProgram = {
      id: Date.now(),
      name,
      city,
      zip,
      address,
      hours,
      phone,
      website,
      materials: mats,
      img,
      owner: currentUser,
      ownerId: currentUserId
    };

    programs.push(newProgram);
    persistAll();
    renderPrograms();
    renderMyArea();

    // Reset program form fields and preview 
    try {
      document.getElementById("progName").value = "";
      document.getElementById("progCity").value = "";
      document.getElementById("progZip").value = "";
      document.getElementById("progAddress").value = "";
      document.getElementById("progHours").value = "";
      document.getElementById("progPhone").value = "";
      document.getElementById("progWebsite").value = "";
      document.querySelectorAll('.prog-mat').forEach(i => i.checked = false);
      if (progImgInput) progImgInput.value = "";
      if (progImgPreview) progImgPreview.innerHTML = "";
    } catch (err) {
      console.warn(err);
    }

    alert("Program posted successfully!");
    updateProgramFormState();
    if (window.feather) feather.replace();
  });

  // === CREATE EVENT ===
  if (createEventBtn) createEventBtn.addEventListener("click", () => {
    const title = document.getElementById("eventTitle")?.value.trim() || "";
    const date = document.getElementById("eventDate")?.value || "";
    const time = document.getElementById("eventTime")?.value || "";
    const city = document.getElementById("eventCity")?.value.trim() || "";
    const venue = document.getElementById("eventVenue")?.value.trim() || "";
    const cat = document.getElementById("eventCategory")?.value || "Other";
    const desc = document.getElementById("eventDesc")?.value.trim() || "";
    const phone = document.getElementById("eventPhone")?.value.trim() || "";
    const website = document.getElementById("eventWebsite")?.value.trim() || "";

    if (!title || !city) {
      alert("Please fill in the required fields.");
      return;
    }

    const img = eventImgPreview?.querySelector("img")?.src || "";

    const newEvent = {
      id: Date.now(),
      title,
      date,
      time,
      city,
      venue,
      category: cat,
      desc,
      phone,
      website,
      img,
      owner: currentUser,
      ownerId: currentUserId
    };

    events.push(newEvent);
    persistAll();
    renderEvents();
    renderMyArea();

    // Reset event form fields and preview
    try {
      document.getElementById("eventTitle").value = "";
      document.getElementById("eventDate").value = "";
      document.getElementById("eventTime").value = "";
      document.getElementById("eventCity").value = "";
      document.getElementById("eventVenue").value = "";
      document.getElementById("eventCategory").selectedIndex = 0;
      document.getElementById("eventPhone").value = "";
      document.getElementById("eventWebsite").value = "";
      document.getElementById("eventDesc").value = "";
      if (eventImgInput) eventImgInput.value = "";
      if (eventImgPreview) eventImgPreview.innerHTML = "";
    } catch (err) {
      console.warn(err);
    }

    alert("Event posted successfully!");
    updateEventFormState();
    if (window.feather) feather.replace();
  });

  // === RENDER FUNCTIONS ===
  function renderPrograms(filterCity = "", filterMaterial = "All") {
    if (!programsGrid) return;
    programsGrid.innerHTML = "";

    const filtered = programs.filter(p => {
      const cityMatch = !filterCity || (p.city && p.city.toLowerCase().includes(filterCity.toLowerCase())) || (p.zip && p.zip.includes(filterCity));
      const materialMatch = filterMaterial === "All" || (p.materials && p.materials.includes(filterMaterial));
      return cityMatch && materialMatch;
    });

    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "card item-card";
      const isEnrolled = enrollments.some(x => Number(x.id) === Number(p.id) && x.type === 'program' && x.user === userKey);
      const isOwner = (p.ownerId && currentUserId) ? Number(p.ownerId) === Number(currentUserId) : p.owner === currentUser;
      card.innerHTML = `
        <div class="item-thumb">${p.img ? `<img src="${p.img}" alt="${escapeHtml(p.name)}">` : "<span style='color:rgba(255,255,255,.4)'>No Image</span>"}</div>
        <div class="item-title">${escapeHtml(p.name)}</div>
        <div class="item-meta">
          <span>${escapeHtml(p.city || "")}</span>
          ${p.zip ? `<span>${escapeHtml(p.zip)}</span>` : ""}
        </div>
        <div class="item-info">
          <div><span class="text-muted">Address:</span> ${escapeHtml(p.address || "N/A")}</div>
          <div><span class="text-muted">Hours:</span> ${escapeHtml(p.hours || "N/A")}</div>
          <div><span class="text-muted">Call:</span> ${escapeHtml(p.phone || "N/A")}</div>
          <div><span class="text-muted">Site:</span> ${p.website ? `<span class="text-link">${escapeHtml(p.website)}</span>` : "N/A"}</div>
        </div>
        <div class="item-meta">
          ${(p.materials||[]).map(m => `<span class="badge badge--green">${escapeHtml(m)}</span>`).join(" ")}
        </div>
        <div class="owner">Posted by <strong>${escapeHtml(p.owner)}</strong></div>
        <div class="actions post-owner-actions">
          ${!isOwner
            ? `<button class="btn btn--primary enroll-btn" data-id="${p.id}" data-type="program">${isEnrolled ? 'Enrolled' : 'Enroll'}</button>`
            : `<button class="btn btn--ghost" data-action="delete-program" data-id="${p.id}"><i data-feather="trash-2"></i> Delete</button>`}
        </div>
      `;
      programsGrid.appendChild(card);
    });

    attachEnrollListeners();
    if (window.feather) feather.replace();
  }

  function renderEvents(filterCity = "") {
    if (!eventsGrid) return;
    eventsGrid.innerHTML = "";

    const filtered = events.filter(e => {
      return !filterCity || (e.city && e.city.toLowerCase().includes(filterCity.toLowerCase()));
    });

    filtered.forEach(e => {
      const card = document.createElement("div");
      card.className = "card item-card";
      const isEnrolledE = enrollments.some(x => Number(x.id) === Number(e.id) && x.type === 'event' && x.user === userKey);
      const isOwnerE = (e.ownerId && currentUserId) ? Number(e.ownerId) === Number(currentUserId) : e.owner === currentUser;
      card.innerHTML = `
        <div class="item-thumb">${e.img ? `<img src="${e.img}" alt="${escapeHtml(e.title)}">` : "<span style='color:rgba(255,255,255,.4)'>No Image</span>"}</div>
        <div class="item-title">${escapeHtml(e.title)}</div>
        <div class="item-meta">
          <span>${escapeHtml(e.city || "")}</span> <span>${escapeHtml(e.date || "")}</span> <span>${escapeHtml(e.time || "")}</span>
        </div>
        <div class="item-info">
          <div><span class="text-muted">Venue:</span> ${escapeHtml(e.venue || "N/A")}</div>
          <div><span class="text-muted">Call:</span> ${escapeHtml(e.phone || "N/A")}</div>
          <div><span class="text-muted">Site:</span> ${e.website ? `<span class="text-link">${escapeHtml(e.website)}</span>` : "N/A"}</div>
        </div>
        <div class="item-meta"><span class="badge badge--green">${escapeHtml(e.category)}</span></div>
        <div class="owner">Posted by <strong>${escapeHtml(e.owner)}</strong></div>
        <div class="actions post-owner-actions">
          ${!isOwnerE
            ? `<button class="btn btn--primary enroll-btn" data-id="${e.id}" data-type="event">${isEnrolledE ? 'Enrolled' : 'Enroll'}</button>`
            : `<button class="btn btn--ghost" data-action="delete-event" data-id="${e.id}"><i data-feather="trash-2"></i> Delete</button>`}
        </div>
      `;
      eventsGrid.appendChild(card);
    });
    attachEnrollListeners();
    if (window.feather) feather.replace();
  }

  // === ENROLL LOGIC ===
  function attachEnrollListeners() {
    const enrollBtns = document.querySelectorAll(".enroll-btn");
    if (!enrollBtns) return;
    enrollBtns.forEach(btn => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const existing = enrollments.find(x => Number(x.id) === Number(id) && x.type === type && x.user === userKey);
        if (existing) {
          // Unenroll
          enrollments = enrollments.filter(x => !(Number(x.id) === Number(id) && x.type === type && x.user === userKey));
          btn.textContent = "Enroll";
        } else {
          // Enroll
          enrollments.push({ id: Number(id), type, user: userKey, timestamp: Date.now() });
          btn.textContent = "Enrolled";
        }
        persistAll();
        renderMyArea();
      };
    });
  }

  // Delegated delete handlers for programs/events
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'delete-program') {
      const id = Number(btn.dataset.id);
      const prog = programs.find(p => Number(p.id) === id);
      if (!prog) return;
      const isOwnerProg = (prog.ownerId && currentUserId) ? Number(prog.ownerId) === Number(currentUserId) : prog.owner === currentUser;
      if (!isOwnerProg) return;
      if (!confirm('Delete this program? This will remove it for everyone.')) return;
      programs = programs.filter(p => Number(p.id) !== id);
      enrollments = enrollments.filter(en => !(en.type === 'program' && Number(en.id) === id));
      persistAll();
      renderPrograms();
      renderMyArea();
      return;
    }

    if (action === 'delete-event') {
      const id = Number(btn.dataset.id);
      const evt = events.find(ev => Number(ev.id) === id);
      if (!evt) return;
      const isOwnerEvt = (evt.ownerId && currentUserId) ? Number(evt.ownerId) === Number(currentUserId) : evt.owner === currentUser;
      if (!isOwnerEvt) return;
      if (!confirm('Delete this event? This will remove it for everyone.')) return;
      events = events.filter(ev => Number(ev.id) !== id);
      enrollments = enrollments.filter(en => !(en.type === 'event' && Number(en.id) === id));
      persistAll();
      renderEvents();
      renderMyArea();
      return;
    }
  });

  // === MY AREA RENDER ===
  function renderMyArea() {
    if (myProgramsGrid) myProgramsGrid.innerHTML = "";
    if (myEventsGrid) myEventsGrid.innerHTML = "";
    if (enrolledList) enrolledList.innerHTML = "";

    const myProgs = programs.filter(p => (p.ownerId && currentUserId) ? Number(p.ownerId) === Number(currentUserId) : p.owner === currentUser);
    const myEvts = events.filter(e => (e.ownerId && currentUserId) ? Number(e.ownerId) === Number(currentUserId) : e.owner === currentUser);
    const myEnrolls = enrollments.filter(e => e.user === userKey);

    myProgs.forEach(p => {
      const count = enrollments.filter(x => Number(x.id) === Number(p.id) && x.type === 'program').length;
      if (myProgramsGrid) myProgramsGrid.innerHTML += `<div class="card item-card"><div class="item-title">${escapeHtml(p.name)}</div><div>${escapeHtml(p.city)}</div><div class="meta-small">${count} ${count === 1 ? 'person' : 'people'} interested</div></div>`;
    });
    if (myProgs.length === 0 && myProgramsGrid) myProgramsGrid.innerHTML = `<div class="meta-small">You haven't posted any programs yet.</div>`;

    myEvts.forEach(e => {
      const countE = enrollments.filter(x => Number(x.id) === Number(e.id) && x.type === 'event').length;
      if (myEventsGrid) myEventsGrid.innerHTML += `<div class="card item-card"><div class="item-title">${escapeHtml(e.title)}</div><div>${escapeHtml(e.city)}</div><div class="meta-small">${countE} ${countE === 1 ? 'person' : 'people'} going</div></div>`;
    });
    if (myEvts.length === 0 && myEventsGrid) myEventsGrid.innerHTML = `<div class="meta-small">You haven't posted any events yet.</div>`;

    myEnrolls.forEach(x => {
      let data = x.type === "program" ? programs.find(p => p.id == x.id) : events.find(e => e.id == x.id);
      if (data && enrolledList) {
        enrolledList.innerHTML += `<div class="card item-card"><div class="item-title">${escapeHtml(data.name || data.title)}</div><div>${escapeHtml(x.type)}</div></div>`;
      }
    });
    if (myEnrolls.length === 0 && enrolledList) enrolledList.innerHTML = `<div class="meta-small">You haven't enrolled in anything yet.</div>`;
  }

  // === FILTERS ===
  if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", () => {
    if (searchCity) searchCity.value = "";
    chipButtons.forEach(c => c.classList.remove("active"));
    if (chipButtons[0]) chipButtons[0].classList.add("active");
    renderPrograms();
  });

  chipButtons.forEach(chip => {
    chip.addEventListener("click", () => {
      chipButtons.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderPrograms(searchCity ? searchCity.value.trim() : "", chip.dataset.material);
    });
  });

  if (searchCity) searchCity.addEventListener("input", () => {
    const activeChip = document.querySelector(".chip.active")?.dataset.material || "All";
    renderPrograms(searchCity.value.trim(), activeChip);
  });

  if (clearEventFiltersBtn) clearEventFiltersBtn.addEventListener("click", () => {
    if (searchEventCity) searchEventCity.value = "";
    renderEvents();
  });

  if (searchEventCity) searchEventCity.addEventListener("input", () => {
    renderEvents(searchEventCity.value.trim());
  });

  // === TABS ===
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      const pane = document.getElementById("tab-" + btn.dataset.tab);
      if (pane) pane.classList.add("active");
    });
  });

  // --- SAFE-HTML helper ---
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // INITIAL RENDER (only call if corresponding containers exist)
  if (programsGrid) renderPrograms();
  if (eventsGrid) renderEvents();
  if (myProgramsGrid || myEventsGrid || enrolledList) renderMyArea();
  if (window.feather) feather.replace();
});
