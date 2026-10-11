/**
 * Tachyon — app.js
 * Design: The Four Pillars
 *
 * Responsibilities:
 *  1. Hero entrance animation + scroll-driven parallax.
 *  2. Leaderboard: fetch, render pillar chart + rank table.
 *  3. Award form: validate, POST, update UI.
 *  4. Event history: fetch + render.
 *  5. Accessibility: loading/error/empty states, aria-live.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────── */

const HOUSE_META = {
  ALPHA:  { label: 'Alpha',  cssClass: 'alpha',  pip: 'pip--alpha'  },
  INFER:  { label: 'Infer',  cssClass: 'infer',  pip: 'pip--infer'  },
  MATRIX: { label: 'Matrix', cssClass: 'matrix', pip: 'pip--matrix' },
  LAYER:  { label: 'Layer',  cssClass: 'layer',  pip: 'pip--layer'  },
};

/* ─────────────────────────────────────────────────────────────────────────
   DOM references
   ───────────────────────────────────────────────────────────────────────── */

const dom = {
  hero:         document.getElementById('hero'),
  pillarsEl:    document.getElementById('pillars'),

  // Per-house bar + score elements
  bars:  {
    ALPHA:  document.getElementById('bar-alpha'),
    INFER:  document.getElementById('bar-infer'),
    MATRIX: document.getElementById('bar-matrix'),
    LAYER:  document.getElementById('bar-layer'),
  },
  scores: {
    ALPHA:  document.getElementById('score-alpha'),
    INFER:  document.getElementById('score-infer'),
    MATRIX: document.getElementById('score-matrix'),
    LAYER:  document.getElementById('score-layer'),
  },

  winnerBanner: document.getElementById('winner-banner'),
  winnerName:   document.getElementById('winner-name'),
  rankBody:     document.getElementById('rank-body'),
  lbError:      document.getElementById('lb-error'),

  awardForm:    document.getElementById('award-form'),
  housePicker:  document.getElementById('house-picker'),
  pointsInput:  document.getElementById('points-input'),
  reasonInput:  document.getElementById('reason-input'),
  submitBtn:    document.getElementById('submit-btn'),
  btnText:      document.querySelector('#submit-btn .btn__text'),
  btnSpinner:   document.querySelector('#submit-btn .btn__spinner'),
  formStatus:   document.getElementById('form-status'),

  houseError:   document.getElementById('house-error'),
  pointsError:  document.getElementById('points-error'),
  reasonError:  document.getElementById('reason-error'),

  historyList:  document.getElementById('history-list'),
  historyPlaceholder: document.getElementById('history-placeholder'),
  historyError: document.getElementById('history-error'),
};

/* ─────────────────────────────────────────────────────────────────────────
   Utility helpers
   ───────────────────────────────────────────────────────────────────────── */

/** Show/hide an element using the hidden attribute. */
function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

/** Format an ISO 8601 UTC string as a short local time. */
function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Ordinal suffix: 1 → "1st", 2 → "2nd", etc. */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Check if the user prefers reduced motion. */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────────────────────────────────
   Hero entrance + scroll-driven parallax
   ───────────────────────────────────────────────────────────────────────── */

function initHero() {
  // Trigger band entrance animation after a short delay.
  requestAnimationFrame(() => {
    setTimeout(() => dom.hero.classList.add('hero--ready'), 80);
  });

  if (prefersReducedMotion()) return;

  // Scroll-driven: dissolve hero content as user scrolls down.
  function onScroll() {
    const scrollY = window.scrollY;
    const threshold = window.innerHeight * 0.35;
    dom.hero.classList.toggle('hero--scrolled', scrollY > threshold);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─────────────────────────────────────────────────────────────────────────
   Pillar chart
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Animate the four pillar bars to heights proportional to their scores.
 * @param {Array<{house: string, score: number}>} houses
 */
function renderPillars(houses) {
  const maxScore = Math.max(...houses.map(h => h.score), 1);

  // Find the winning score for highlighting.
  const topScore = Math.max(...houses.map(h => h.score));

  houses.forEach(({ house, score, rank }) => {
    const bar   = dom.bars[house];
    const scoreEl = dom.scores[house];
    const pillar = bar?.closest('.pillar');
    if (!bar || !scoreEl || !pillar) return;

    const pct = score > 0 ? (score / maxScore) * 100 : 0;

    // Use a rAF to allow CSS transition to fire from 0→target.
    requestAnimationFrame(() => {
      if (score === 0) {
        bar.style.height = '0%';
        bar.classList.add('pillar__bar--floor');
      } else {
        bar.classList.remove('pillar__bar--floor');
        bar.style.height = `${pct}%`;
      }
    });

    scoreEl.textContent = score;

    // Mark the leading house(es).
    pillar.classList.toggle('pillar--leading', score === topScore && topScore > 0);
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Rank table
   ───────────────────────────────────────────────────────────────────────── */

function renderRankTable(houses) {
  const rows = houses.map(({ rank, house, score }) => {
    const meta = HOUSE_META[house] || { label: house, pip: '' };
    const isFirst = rank === 1 && score > 0;
    return `
      <tr>
        <td class="rank-table__rank ${isFirst ? 'rank-table__rank--first' : ''}">
          ${ordinal(rank)}
        </td>
        <td>
          <div class="rank-table__house">
            <span class="rank-table__pip ${meta.pip}" aria-hidden="true"></span>
            <span class="rank-table__house-name">${meta.label}</span>
          </div>
        </td>
        <td class="rank-table__points">${score}</td>
      </tr>`;
  }).join('');

  dom.rankBody.innerHTML = rows;
}

/* ─────────────────────────────────────────────────────────────────────────
   Winner banner
   ───────────────────────────────────────────────────────────────────────── */

function renderWinner(winners) {
  if (!winners || winners.length === 0) {
    hide(dom.winnerBanner);
    return;
  }

  const names = winners
    .map(h => HOUSE_META[h]?.label ?? h)
    .join(' & ');

  dom.winnerName.textContent = names;
  dom.winnerBanner.querySelector('.winner-banner__label').textContent =
    winners.length === 1 ? 'Leading' : 'Co-leading';
  show(dom.winnerBanner);
}

/* ─────────────────────────────────────────────────────────────────────────
   Fetch & render leaderboard
   ───────────────────────────────────────────────────────────────────────── */

async function fetchLeaderboard() {
  hide(dom.lbError);

  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderPillars(data.houses);
    renderRankTable(data.houses);
    renderWinner(data.winners);
  } catch (err) {
    dom.lbError.textContent = 'Could not load leaderboard. Check your connection and try refreshing.';
    show(dom.lbError);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Event history
   ───────────────────────────────────────────────────────────────────────── */

function renderHistory(events) {
  if (!events || events.length === 0) {
    dom.historyList.innerHTML =
      '<p class="history-empty">No points have been awarded yet.</p>';
    return;
  }

  // Newest first for readability.
  const sorted = [...events].reverse();

  const items = sorted.map(ev => {
    const meta = HOUSE_META[ev.house] || { label: ev.house, pip: '' };
    return `
      <div class="history-item" role="listitem">
        <span class="history-item__pip ${meta.pip}" aria-hidden="true"></span>
        <div class="history-item__body">
          <p class="history-item__reason">${escapeHtml(ev.reason)}</p>
          <p class="history-item__house">${meta.label}</p>
        </div>
        <div class="history-item__meta">
          <span class="history-item__points">+${ev.points}</span>
          <time class="history-item__time" datetime="${ev.recorded_at}">
            ${formatTime(ev.recorded_at)}
          </time>
        </div>
      </div>`;
  }).join('');

  dom.historyList.setAttribute('role', 'list');
  dom.historyList.innerHTML = items;
}

async function fetchHistory() {
  hide(dom.historyError);

  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderHistory(data.events);
  } catch (err) {
    if (dom.historyPlaceholder) dom.historyPlaceholder.remove();
    dom.historyError.textContent = 'Could not load event history.';
    show(dom.historyError);
  }
}

/** Basic HTML-entity escaping to prevent XSS in history items. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────────────────────────
   Award form
   ───────────────────────────────────────────────────────────────────────── */

/** Show/hide a field error. Returns true if field is invalid. */
function fieldError(inputEl, errorEl, condition, message) {
  if (condition) {
    inputEl.classList.add('form-input--error');
    errorEl.textContent = message;
    show(errorEl);
    return true;
  }
  inputEl.classList.remove('form-input--error');
  hide(errorEl);
  return false;
}

/** Validate the award form. Returns true if all fields are valid. */
function validateForm() {
  const house    = dom.awardForm.querySelector('[name="house"]:checked');
  const pointsRaw = dom.pointsInput.value.trim();
  const reason   = dom.reasonInput.value.trim();

  let valid = true;

  // House
  const houseEl = dom.housePicker.querySelector('fieldset') || dom.housePicker;
  if (!house) {
    dom.houseError.textContent = 'Select a house.';
    show(dom.houseError);
    valid = false;
  } else {
    hide(dom.houseError);
  }

  // Points
  const pointsNum = Number(pointsRaw);
  const badPoints =
    pointsRaw === '' ||
    !Number.isInteger(pointsNum) ||
    pointsNum < 1;

  if (fieldError(
    dom.pointsInput, dom.pointsError,
    badPoints,
    'Enter a whole number greater than zero.',
  )) valid = false;

  // Reason
  if (fieldError(
    dom.reasonInput, dom.reasonError,
    reason === '',
    'Enter a reason for this award.',
  )) valid = false;

  return valid;
}

/** Set the submit button to loading state. */
function setSubmitting(loading) {
  dom.submitBtn.disabled = loading;
  dom.btnText.textContent = loading ? 'Awarding…' : 'Award Points';
  dom.btnSpinner.hidden = !loading;
}

/** Show a transient status message on the form. */
function showStatus(message, type) {
  dom.formStatus.textContent = message;
  dom.formStatus.className = `form-status form-status--${type}`;

  if (type === 'success') {
    // Auto-clear after 4 s.
    setTimeout(() => { dom.formStatus.textContent = ''; dom.formStatus.className = 'form-status'; }, 4000);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const house  = dom.awardForm.querySelector('[name="house"]:checked').value;
  const points = parseInt(dom.pointsInput.value.trim(), 10);
  const reason = dom.reasonInput.value.trim();

  setSubmitting(true);
  dom.formStatus.textContent = '';
  dom.formStatus.className = 'form-status';

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ house, points, reason }),
    });

    const data = await res.json();

    if (res.status === 201) {
      showStatus(`✓ ${points} point${points !== 1 ? 's' : ''} awarded to ${HOUSE_META[house]?.label ?? house}.`, 'success');
      dom.awardForm.reset();
      // Clear any lingering error states after a reset.
      hide(dom.houseError);
      hide(dom.pointsError);
      hide(dom.reasonError);
      dom.pointsInput.classList.remove('form-input--error');
      dom.reasonInput.classList.remove('form-input--error');

      // Refresh leaderboard and history.
      await Promise.all([fetchLeaderboard(), fetchHistory()]);
    } else {
      showStatus(data.error ?? `Error ${res.status} — please try again.`, 'error');
    }
  } catch (err) {
    showStatus('Network error — check your connection and try again.', 'error');
  } finally {
    setSubmitting(false);
  }
}

/** Clear field errors on input (progressive validation). */
function attachFieldListeners() {
  dom.awardForm.querySelectorAll('[name="house"]').forEach(radio => {
    radio.addEventListener('change', () => hide(dom.houseError));
  });

  dom.pointsInput.addEventListener('input', () => {
    if (dom.pointsInput.value.trim() !== '') {
      dom.pointsInput.classList.remove('form-input--error');
      hide(dom.pointsError);
    }
  });

  dom.reasonInput.addEventListener('input', () => {
    if (dom.reasonInput.value.trim() !== '') {
      dom.reasonInput.classList.remove('form-input--error');
      hide(dom.reasonError);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Pillars IntersectionObserver — animate on first visible entry
   ───────────────────────────────────────────────────────────────────────── */

function initPillarsObserver() {
  if (!('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Trigger a re-fetch (which sets bar heights) when chart enters view.
        fetchLeaderboard();
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  obs.observe(dom.pillarsEl);
}

/* ─────────────────────────────────────────────────────────────────────────
   Bootstrap
   ───────────────────────────────────────────────────────────────────────── */

function init() {
  initHero();
  initPillarsObserver();

  // Initial data load.
  fetchLeaderboard();
  fetchHistory();

  // Form.
  dom.awardForm.addEventListener('submit', handleFormSubmit);
  attachFieldListeners();
}

// Wait for DOM to be fully parsed before running.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
