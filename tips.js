
const scroller = document.getElementById("tipsScroller");
const listEl   = document.getElementById("tipsList");

// Wheel feel controls
const WHEEL_GAIN = 0.55;        
const WHEEL_DURATION = 900;     
const KEY_DURATION   = 700;     

// 20 static tips
const TIPS = [
  { title: "Green Living Made Simple", text: "Tip: Carry a reusable water bottle and shopping bag to cut single‑use plastics in your daily routine." },
  { title: "Save Energy, Save Earth", text: "Tip: Switch off lights and unplug chargers when not in use. LEDs lower both cost and carbon." },
  { title: "Rethink, Reduce, Recycle", text: "Tip: Choose durable items over disposables; compost food scraps and recycle clean materials." },
  { title: "Eat More Plants", text: "Tip: Try one plant‑based day a week. It reduces emissions and saves water." },
  { title: "Smart Laundry", text: "Tip: Wash with cold water and air‑dry when you can. Clean the lint filter for dryer efficiency." },
  { title: "Eco Commute", text: "Tip: Walk, cycle, carpool, or take transit. Combine errands to cut extra trips." },
  { title: "Mindful Water Use", text: "Tip: Fix dripping taps, install aerators, and take shorter showers to conserve water." },
  { title: "Buy Local, Seasonal", text: "Tip: Choose local, seasonal produce to reduce transport emissions and support your community." },
  { title: "Second‑Life Goods", text: "Tip: Repair before replacing. Donate, sell, or swap items to extend their life." },
  { title: "Clean Green", text: "Tip: Use vinegar, baking soda, and lemon for many cleaning tasks—low tox and low waste." },
  { title: "Battery Sense", text: "Tip: Use rechargeable batteries and recycle old ones at approved drop‑off points." },
  { title: "Paper Smarts", text: "Tip: Go digital for bills/receipts and print double‑sided only when necessary." },
  { title: "Shade And Insulate", text: "Tip: Close blinds in summer, seal drafts in winter. Insulation saves energy year‑round." },
  { title: "Climate‑Friendly Cooking", text: "Tip: Use lids, match pot size to burner, and batch‑cook to save time and energy." },
  { title: "Standby Power Cut", text: "Tip: Plug devices into a switchable power strip and turn it off when idle." },
  { title: "E‑Waste Drop‑Off", text: "Tip: Recycle phones, cables, and electronics at e‑waste centers to recover valuable materials." },
  { title: "Library And Sharing", text: "Tip: Borrow books, tools, or appliances from libraries and community sharing hubs." },
  { title: "Conscious Fashion", text: "Tip: Buy fewer, higher‑quality clothes. Wash cold, line‑dry, and repair to extend life." },
  { title: "Compost Starter", text: "Tip: Compost fruit/veg scraps, coffee grounds, and yard waste to make soil and cut landfill methane." },
  { title: "Rain Barrel Ready", text: "Tip: If allowed in your area, capture rainwater for gardens and outdoor cleaning." }
];

// ---------- Rendering ----------
function renderTips(tips) {
  const html = tips.map(t => `
    <li class="tip-card">
      <h3 class="tip-heading">${escapeHTML(t.title)}</h3>
      <p class="tip-body">${escapeHTML(t.text)}</p>
    </li>
  `).join("");
  listEl.innerHTML = html;

  // Start at top and activate first card
  scroller.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    updateActiveCard(true);
    listEl.classList.add("has-active");
    recalcCardCenters();
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- Spotlight handling ----------
let activeIndex = 0;

function updateActiveCard(forceTopCheck = false) {
  const cards = getCards();
  if (!cards.length) return;

  const TOP_THRESHOLD = 6;
  const BOTTOM_THRESHOLD = 6;
  const maxScroll = scroller.scrollHeight - scroller.clientHeight;

  if (forceTopCheck || scroller.scrollTop <= TOP_THRESHOLD) {
    setActive(0);
    return;
  }
  if (maxScroll - scroller.scrollTop <= BOTTOM_THRESHOLD) {
    setActive(cards.length - 1);
    return;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const centerY = scrollerRect.top + scrollerRect.height / 2;

  let bestIdx = 0;
  let bestDist = Infinity;

  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const cardCenter = r.top + r.height / 2;
    const dist = Math.abs(centerY - cardCenter);
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  });

  setActive(bestIdx);
}

function setActive(idx) {
  activeIndex = idx;
  const cards = getCards();
  cards.forEach(c => c.classList.remove("active"));
  cards[idx]?.classList.add("active");
}

function getCards() {
  return Array.from(listEl.querySelectorAll(".tip-card"));
}

// ---------- Smooth “glide” wheel scrolling ----------
let centers = [];
let animFrame = null;
let animStart = 0;
let animFrom = 0;
let animTo = 0;
let animDuration = WHEEL_DURATION;

function recalcCardCenters() {
  centers = getCards().map(card => {
    const scRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const topInScroller = cardRect.top - scRect.top + scroller.scrollTop;
    const target = Math.round(topInScroller - (scroller.clientHeight - card.offsetHeight) / 2);
    return clamp(target, 0, scroller.scrollHeight - scroller.clientHeight);
  });
}

function smoothScrollTo(y, duration) {
  const max = scroller.scrollHeight - scroller.clientHeight;
  y = clamp(y, 0, max);

  animFrom = scroller.scrollTop;
  animTo = y;
  animDuration = duration;
  animStart = performance.now();

  if (!animFrame) {
    animFrame = requestAnimationFrame(step);
  }
}

function step(now) {
  const t = Math.min(1, (now - animStart) / animDuration);
  const eased = easeOutCubic(t);      // slow, buttery finish
  scroller.scrollTop = animFrom + (animTo - animFrom) * eased;

  if (t < 1) {
    animFrame = requestAnimationFrame(step);
  } else {
    animFrame = null;
    updateActiveCard();
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Route wheel from anywhere to a slow, smooth glide
function onWheelGlide(e) {
  if (shouldIgnoreEvent(e.target)) return;
  e.preventDefault();

  // translate wheel distance into a smaller, gentler move
  const delta = e.deltaY * WHEEL_GAIN;
  const next = scroller.scrollTop + delta;

  // restart animation toward the new target (keeps it responsive)
  smoothScrollTo(next, WHEEL_DURATION);
}

// Keyboard: move roughly one card at a time with a smooth glide
function onKeyNav(e) {
  if (shouldIgnoreEvent(e.target)) return;

  let handled = true;
  switch (e.key) {
    case "ArrowDown":
    case "PageDown":
    case " ":
      scrollToIndex(activeIndex + 1, KEY_DURATION);
      break;
    case "ArrowUp":
    case "PageUp":
      scrollToIndex(activeIndex - 1, KEY_DURATION);
      break;
    case "Home":
      scrollToIndex(0, KEY_DURATION);
      break;
    case "End":
      scrollToIndex(getCards().length - 1, KEY_DURATION);
      break;
    default:
      handled = false;
  }
  if (handled) e.preventDefault();
}

function scrollToIndex(idx, duration) {
  const cards = getCards();
  if (!cards.length) return;
  idx = clamp(idx, 0, cards.length - 1);
  setActive(idx);
  smoothScrollTo(centers[idx] ?? 0, duration);
}

function shouldIgnoreEvent(target) {
  return !!(target.closest("input, textarea, select, [contenteditable='true']"));
}

// ---------- Event wiring ----------
let scrollRAF = null;
scroller.addEventListener("scroll", () => {
  if (scrollRAF) return;
  scrollRAF = requestAnimationFrame(() => {
    updateActiveCard();
    recalcCardCenters();
    scrollRAF = null;
  });
});

window.addEventListener("resize", () => {
  recalcCardCenters();
  updateActiveCard();
});

// Wheel/trackpad + keys from anywhere
window.addEventListener("wheel", onWheelGlide, { passive: false });
window.addEventListener("keydown", onKeyNav, { passive: false });

// ---------- Init ----------
renderTips(TIPS);