<?php $title='Recycling - GreenLink'; include __DIR__ . '/inc/header.php'; ?>
<link rel="stylesheet" href="recycle.css">
<main class="recycle-wrapper">
  <section class="recycle-head">
    <h1>Recycling Programs & Events</h1>
    <p>Find local recycling programs, post community events, and help your area recycle better.</p>
  </section>

  <nav class="recycle-tabs card">
    <button class="tab-btn active" data-tab="programs"><i data-feather="map"></i> Programs</button>
    <button class="tab-btn" data-tab="events"><i data-feather="calendar"></i> Events</button>
    <button class="tab-btn" data-tab="myarea"><i data-feather="user"></i> My Area</button>
  </nav>

  <!-- --- PROGRAMS TAB --- -->
  <section id="tab-programs" class="tab-pane active">
    <section class="card compose">
      <h3 class="section-title"><i data-feather="plus-circle"></i> Create a Recycling Program</h3>
      <div class="compose-grid">
        <div class="compose-left">
          <label class="field"><span>Program Name</span><input id="progName" type="text" placeholder="e.g., Greenfield Community Recycling Center"></label>
          <div class="row2">
            <label class="field"><span>City</span><input id="progCity" type="text" placeholder="e.g., Greenfield" list="citiesData"></label>
            <label class="field"><span>ZIP</span><input id="progZip" type="text" placeholder="e.g., 10010"></label>
          </div>
          <label class="field"><span>Address</span><input id="progAddress" type="text" placeholder="e.g., 120 Evergreen Rd"></label>
          <div class="row2">
            <label class="field"><span>Hours</span><input id="progHours" type="text" placeholder="e.g., Mon–Sat 8:00–18:00"></label>
            <label class="field"><span>Phone</span><input id="progPhone" type="tel" placeholder="+1 555 201 1111"></label>
          </div>
          <label class="field"><span>Website</span><input id="progWebsite" type="url" placeholder="https://example.org/recycling-center"></label>
          <div class="field"><span>Materials Accepted</span><div class="materials">
            <label class="chipcheck"><input type="checkbox" class="prog-mat" value="Paper"><span>Paper</span></label>
            <label class="chipcheck"><input type="checkbox" class="prog-mat" value="Plastic"><span>Plastic</span></label>
            <label class="chipcheck"><input type="checkbox" class="prog-mat" value="Glass"><span>Glass</span></label>
            <label class="chipcheck"><input type="checkbox" class="prog-mat" value="Metal"><span>Metal</span></label>
            <label class="chipcheck"><input type="checkbox" class="prog-mat" value="Electronics"><span>Electronics</span></label>
          </div></div>
          <button id="createProgramBtn" class="btn btn--primary" disabled><i data-feather="plus"></i> Post Program</button>
        </div>
        <div class="compose-right">
          <label class="add-photo" for="progImgInput"><i data-feather="image"></i> Add Photo
            <input type="file" accept="image/*" id="progImgInput" hidden>
          </label>
          <div id="progImgPreview" class="img-preview"></div>
        </div>
      </div>
    </section>

    <section class="card filters">
      <div class="filters__row">
        <label class="field"><span>City or ZIP</span><input id="searchCity" type="text" placeholder="e.g., Greenfield or 10010" list="citiesData"></label>
        <button id="clearFilters" class="btn"><i data-feather="x-circle"></i> Clear</button>
      </div>
      <div class="chips">
        <button class="chip active" data-material="All">All</button>
        <button class="chip" data-material="Paper">Paper</button>
        <button class="chip" data-material="Plastic">Plastic</button>
        <button class="chip" data-material="Glass">Glass</button>
        <button class="chip" data-material="Electronics">Electronics</button>
      </div>
    </section>

    <section class="grid" id="programsGrid"></section>
  </section>

  <!-- --- EVENTS TAB --- -->
  <section id="tab-events" class="tab-pane">
    <section class="card compose">
      <h3 class="section-title"><i data-feather="calendar"></i> Create an Event</h3>
      <div class="compose-grid">
        <div class="compose-left">
          <label class="field"><span>Event Title</span><input id="eventTitle" type="text" placeholder="e.g., Community Plastic Swap"></label>
          <div class="row2">
            <label class="field"><span>Date</span><input id="eventDate" type="date"></label>
            <label class="field"><span>Time</span><input id="eventTime" type="time"></label>
          </div>
          <div class="row2">
            <label class="field"><span>City</span><input id="eventCity" type="text" placeholder="e.g., Greenfield" list="citiesData"></label>
            <label class="field"><span>Venue</span><input id="eventVenue" type="text" placeholder="e.g., Town Hall"></label>
          </div>
          <label class="field"><span>Category</span>
            <select id="eventCategory">
              <option>Cleanup</option>
              <option>Swap</option>
              <option>Workshop</option>
              <option>Collection Drive</option>
              <option>Other</option>
            </select>
          </label>
          <label class="field"><span>Contact Phone</span><input id="eventPhone" type="tel" placeholder="+1 555 123 4444"></label>
          <label class="field"><span>Website</span><input id="eventWebsite" type="url" placeholder="https://example.org/event"></label>
          <label class="field"><span>Description</span><textarea id="eventDesc" rows="4" placeholder="Event details"></textarea></label>
          <button id="createEventBtn" class="btn btn--primary" disabled><i data-feather="plus"></i> Post Event</button>
        </div>
        <div class="compose-right">
          <label class="add-photo" for="eventImgInput"><i data-feather="image"></i> Add Photo
            <input type="file" accept="image/*" id="eventImgInput" hidden>
          </label>
          <div id="eventImgPreview" class="img-preview"></div>
        </div>
      </div>
    </section>

    <section class="card filters">
      <div class="filters__row">
        <label class="field"><span>Search events by city</span><input id="searchEventCity" type="text" placeholder="e.g., Greenfield" list="citiesData"></label>
        <button id="clearEventFilters" class="btn"><i data-feather="x-circle"></i> Clear</button>
      </div>
    </section>

    <section class="grid" id="eventsGrid"></section>
  </section>

  <!-- --- MY AREA TAB --- -->
  <section id="tab-myarea" class="tab-pane">
    <section class="card">
      <h3 class="section-title"><i data-feather="user"></i> My Posts</h3>
      <div id="myProgramsGrid"></div>
      <div id="myEventsGrid" style="margin-top:1rem"></div>
    </section>

    <section class="card">
      <h3 class="section-title"><i data-feather="check-square"></i> My Enrollments</h3>
      <div id="enrolledList"></div>
    </section>
  </section>

  <!-- Shared datalist for cities/ZIPs -->
  <datalist id="citiesData">
    <option value="Greenfield"></option>
    <option value="Springvale"></option>
    <option value="Riverside"></option>
    <option value="10010"></option>
    <option value="20020"></option>
  </datalist>
</main>

<script src="recycle.js" defer></script>
<?php include __DIR__ . '/inc/footer.php'; ?>
