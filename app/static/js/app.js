/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TACHYON — UNIFIED APPLICATION & MOTION ENGINE (app.js)
 * 
 * Features:
 *  1. Custom Meteor Cursor & Canvas Ribbon Tail
 *  2. Scroll-Synchronized Video Scrubbing & Motion Engine
 *     - Scene A1: Cosmic Ingress & Title Emergence (t: 0.00 -> 0.22)
 *     - Scene A2: Dedicated Cinematic Hold (t: 0.22 -> 0.36)
 *     - Scene B: Galaxy Video Scrubbing & Typography (t: 0.36 -> 0.66)
 *     - Scene C: Desert Video Scrubbing & Four Houses (t: 0.66 -> 1.00)
 *  3. Live Authoritative Backend Integration (Flask REST API)
 *     - GET  /api/leaderboard -> Pillar Chart & Rankings Table
 *     - GET  /api/events      -> Real-Time Historical Audit Ledger
 *     - POST /api/events      -> Validated Point Awards Submission
 *  4. HUD Telemetry & Navigation Controls
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

// ─── Utility Helpers ────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = () =>
  window.matchMedia('(pointer: coarse)').matches;

const HOUSE_META = {
  ALPHA:  { name: 'Alpha',  tag: 'Electric Azure', glyph: '▲', color: '#38bdf8', pip: 'pip--alpha', pill: 'history-house-pill--alpha' },
  INFER:  { name: 'Infer',  tag: 'Solar Flame',    glyph: '◆', color: '#f97316', pip: 'pip--infer', pill: 'history-house-pill--infer' },
  MATRIX: { name: 'Matrix', tag: 'Jade Matrix',    glyph: '■', color: '#10b981', pip: 'pip--matrix', pill: 'history-house-pill--matrix' },
  LAYER:  { name: 'Layer',  tag: 'Royal Violet',   glyph: '●', color: '#a855f7', pip: 'pip--layer', pill: 'history-house-pill--layer' },
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── DOM References ─────────────────────────────────────────────────────────
const dom = {
  // Cinematic Journey Stage
  scrollContainer: document.getElementById('scroll-container'),
  stageViewport: document.getElementById('stage-viewport'),
  celestialLayer: document.getElementById('celestial-layer'),
  galaxyImg: document.getElementById('galaxy-img'),
  galaxyGlow: document.getElementById('galaxy-glow'),
  galaVideo: document.getElementById('gala-video'),
  desertVideo: document.getElementById('desert-video'),
  photonWash: document.getElementById('photon-wash'),
  goldenDawnHaze: document.getElementById('golden-dawn-haze'),
  particleCanvas: document.getElementById('particle-canvas'),
  cosmicBurst: document.getElementById('cosmic-burst'),
  monumentContainer: document.getElementById('monument-container'),
  monumentHalo: document.getElementById('monument-halo'),
  monumentTitle: document.getElementById('monument-title'),
  monumentSubline: document.getElementById('monument-subline'),
  storyGala1: document.getElementById('story-gala-1'),
  storyGala2: document.getElementById('story-gala-2'),
  storyDesertCallout: document.getElementById('story-desert-callout'),
  storyHouses: document.getElementById('story-houses'),
  houseAlpha: document.getElementById('house-alpha'),
  houseInfer: document.getElementById('house-infer'),
  houseMatrix: document.getElementById('house-matrix'),
  houseLayer: document.getElementById('house-layer'),

  // Cursor & Telemetry HUD
  cursorCanvas: document.getElementById('cursor-canvas'),
  cursorHead: document.getElementById('cursor-head'),
  coordinatesText: document.getElementById('hud-coords'),
  scrollFill: document.getElementById('scroll-fill'),

  // Application Headquarters
  appMain: document.getElementById('app'),
  winnerBanner: document.getElementById('winner-banner'),
  winnerName: document.getElementById('winner-name'),
  pillarsChart: document.getElementById('pillars'),
  bars: {
    ALPHA: document.getElementById('bar-alpha'),
    INFER: document.getElementById('bar-infer'),
    MATRIX: document.getElementById('bar-matrix'),
    LAYER: document.getElementById('bar-layer'),
  },
  scores: {
    ALPHA: document.getElementById('score-alpha'),
    INFER: document.getElementById('score-infer'),
    MATRIX: document.getElementById('score-matrix'),
    LAYER: document.getElementById('score-layer'),
  },
  rankTags: {
    ALPHA: document.getElementById('rank-tag-alpha'),
    INFER: document.getElementById('rank-tag-infer'),
    MATRIX: document.getElementById('rank-tag-matrix'),
    LAYER: document.getElementById('rank-tag-layer'),
  },
  rankBody: document.getElementById('rank-body'),
  lbError: document.getElementById('lb-error'),

  // Award Points Form
  awardForm: document.getElementById('award-form'),
  housePicker: document.getElementById('house-picker'),
  pointsInput: document.getElementById('points-input'),
  reasonInput: document.getElementById('reason-input'),
  reasonCount: document.getElementById('reason-count'),
  submitBtn: document.getElementById('submit-btn'),
  btnText: document.querySelector('#submit-btn .btn-text'),
  btnSpinner: document.querySelector('#submit-btn .btn-spinner'),
  formStatus: document.getElementById('form-status'),
  houseError: document.getElementById('house-error'),
  pointsError: document.getElementById('points-error'),
  reasonError: document.getElementById('reason-error'),

  // Event History
  historyList: document.getElementById('history-list'),
  historyPlaceholder: document.getElementById('history-placeholder'),
  historyError: document.getElementById('history-error'),

  // Navigation Links
  backToTop: document.getElementById('back-to-top'),
};

const pCtx = dom.particleCanvas ? dom.particleCanvas.getContext('2d') : null;
const cCtx = dom.cursorCanvas ? dom.cursorCanvas.getContext('2d') : null;

// ─── Canvas Sizing ──────────────────────────────────────────────────────────
let width = window.innerWidth;
let height = window.innerHeight;

function resizeCanvases() {
  width = window.innerWidth;
  height = window.innerHeight;

  if (dom.particleCanvas && pCtx) {
    dom.particleCanvas.width = width;
    dom.particleCanvas.height = height;
    pCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  if (dom.cursorCanvas && cCtx) {
    dom.cursorCanvas.width = width;
    dom.cursorCanvas.height = height;
    cCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// ─── State Store ────────────────────────────────────────────────────────────
const state = {
  scroll: {
    target: 0,
    current: 0,
    max: 1,
    inApp: false,
  },
  cursor: {
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    lastX: -100,
    lastY: -100,
    vx: 0,
    vy: 0,
    active: false,
    hovering: false,
    history: [],
    embers: [],
  },
  particles: [],
};

// ─── Dynamic Particle Engine ────────────────────────────────────────────────
function initParticles() {
  const count = Math.min(Math.floor(width * 0.038), 44);
  state.particles = [];

  for (let i = 0; i < count; i++) {
    const isGold = Math.random() > 0.65;
    state.particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      depth: Math.random() * 0.8 + 0.2,
      radius: Math.random() * 1.5 + 0.5,
      baseAlpha: Math.random() * 0.35 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.0014 + 0.0006,
      r: isGold ? 245 : 120,
      g: isGold ? 195 : 190,
      b: isGold ? 100 : 255,
    });
  }
}

function renderParticles(scrollT, now) {
  if (!pCtx) return;
  pCtx.clearRect(0, 0, width, height);

  // If user scrolled deeply into the application content, pause particle drawing
  if (state.scroll.inApp) return;

  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const mouseOffsetX = state.cursor.active ? (state.cursor.x - centerX) * 0.02 : 0;
  const mouseOffsetY = state.cursor.active ? (state.cursor.y - centerY) * 0.02 : 0;

  const isWarping = scrollT >= 0.42 && scrollT < 0.66;
  const warpIntensity = isWarping ? Math.sin(((scrollT - 0.42) / 0.24) * Math.PI) : 0;
  const isDesert = scrollT >= 0.70;

  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];

    if (isWarping && warpIntensity > 0.08) {
      // Warp Speed Streaks
      const angle = Math.atan2(p.y - centerY, p.x - centerX);
      const streakLength = warpIntensity * p.depth * 50;

      const x2 = p.x + Math.cos(angle) * streakLength;
      const y2 = p.y + Math.sin(angle) * streakLength;
      const alpha = p.baseAlpha * (0.8 + warpIntensity * 0.9);

      pCtx.beginPath();
      pCtx.moveTo(p.x, p.y);
      pCtx.lineTo(x2, y2);
      pCtx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${clamp(alpha, 0, 1).toFixed(2)})`;
      pCtx.lineWidth = p.radius * (1 + warpIntensity * 1.6);
      pCtx.lineCap = 'round';
      pCtx.stroke();
    } else if (isDesert) {
      // Wind-blown Desert Sand Motes
      const windOffset = (now * 0.038 * p.depth) % width;
      let px = (p.x + windOffset) % width;
      let py = (p.y + Math.sin(now * 0.0012 + p.phase) * 14) % height;

      const shimmer = Math.sin(now * p.speed * 1.8 + p.phase) * 0.3 + 0.7;
      const alpha = p.baseAlpha * shimmer * 0.85;

      pCtx.beginPath();
      pCtx.arc(px, py, p.radius * 0.85, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(245, 190, 95, ${clamp(alpha, 0, 0.85).toFixed(2)})`;
      pCtx.fill();
    } else {
      // Ambient Deep Space Stardust
      let px = p.x + mouseOffsetX * p.depth;
      let py = p.y + mouseOffsetY * p.depth + (scrollT * 70 * p.depth);

      px = ((px % width) + width) % width;
      py = ((py % height) + height) % height;

      const shimmer = Math.sin(now * p.speed + p.phase) * 0.25 + 0.75;
      const alpha = p.baseAlpha * shimmer * (0.8 + scrollT * 0.4);

      pCtx.beginPath();
      pCtx.arc(px, py, p.radius, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${clamp(alpha, 0, 1).toFixed(2)})`;
      pCtx.fill();
    }
  }
}

// ─── Meteor Cursor & Ribbon Tail ────────────────────────────────────────────
function initCustomCursor() {
  if (isTouchDevice()) return;

  document.body.classList.add('has-custom-cursor');
  if (dom.cursorHead) dom.cursorHead.classList.add('active');

  const interactiveEls = 'a, button, input, textarea, label, [role="button"], .pillar, .guide-card, .house-picker-option';
  document.querySelectorAll(interactiveEls).forEach(el => {
    el.addEventListener('mouseenter', () => {
      state.cursor.hovering = true;
      if (dom.cursorHead) dom.cursorHead.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      state.cursor.hovering = false;
      if (dom.cursorHead) dom.cursorHead.classList.remove('hovering');
    });
  });
}

function onMouseMove(e) {
  state.cursor.targetX = e.clientX;
  state.cursor.targetY = e.clientY;

  if (!state.cursor.active) {
    state.cursor.x = e.clientX;
    state.cursor.y = e.clientY;
    state.cursor.lastX = e.clientX;
    state.cursor.lastY = e.clientY;
    state.cursor.active = true;
  }

  isCursorActive = true;
  wakeLoop();
}

function renderCursorTail(now) {
  if (!cCtx) return;
  cCtx.clearRect(0, 0, width, height);

  if (!state.cursor.active || isTouchDevice()) return;

  const smoothing = prefersReducedMotion() ? 1.0 : 0.38;
  state.cursor.x = lerp(state.cursor.x, state.cursor.targetX, smoothing);
  state.cursor.y = lerp(state.cursor.y, state.cursor.targetY, smoothing);

  state.cursor.vx = state.cursor.x - state.cursor.lastX;
  state.cursor.vy = state.cursor.y - state.cursor.lastY;
  state.cursor.lastX = state.cursor.x;
  state.cursor.lastY = state.cursor.y;

  const speed = Math.hypot(state.cursor.vx, state.cursor.vy);

  // Position luminous head
  if (dom.cursorHead) {
    dom.cursorHead.style.transform = `translate3d(${state.cursor.x.toFixed(1)}px, ${state.cursor.y.toFixed(1)}px, 0)`;
  }

  // Record point
  state.cursor.history.push({
    x: state.cursor.x,
    y: state.cursor.y,
    time: now,
    speed: speed,
  });

  // Prune history (240ms trailing lifespan)
  state.cursor.history = state.cursor.history.filter(pt => now - pt.time < 240);

  // Emit trailing cosmic embers
  if (speed > 1.2 && Math.random() < 0.65) {
    state.cursor.embers.push({
      x: state.cursor.x + (Math.random() - 0.5) * 4,
      y: state.cursor.y + (Math.random() - 0.5) * 4,
      vx: -state.cursor.vx * 0.18 + (Math.random() - 0.5) * 1.2,
      vy: -state.cursor.vy * 0.18 + (Math.random() - 0.5) * 1.2,
      radius: Math.random() * 1.8 + 0.6,
      alpha: 0.9,
      decay: Math.random() * 0.04 + 0.02,
      hue: Math.random() > 0.4 ? 'gold' : 'blue',
    });
  }

  // 1. Render Ribbon Tail
  if (state.cursor.history.length > 2) {
    cCtx.save();
    for (let i = 1; i < state.cursor.history.length; i++) {
      const p0 = state.cursor.history[i - 1];
      const p1 = state.cursor.history[i];
      const ageRatio = (now - p1.time) / 240;
      const alpha = Math.max(0, (1 - ageRatio) * 0.85);
      const w = lerp(5.5, 0.8, ageRatio);

      // Outer electric blue aura
      cCtx.beginPath();
      cCtx.moveTo(p0.x, p0.y);
      cCtx.lineTo(p1.x, p1.y);
      cCtx.strokeStyle = `rgba(56, 189, 248, ${(alpha * 0.45).toFixed(3)})`;
      cCtx.lineWidth = w * 2.2;
      cCtx.lineCap = 'round';
      cCtx.stroke();

      // Golden core
      cCtx.beginPath();
      cCtx.moveTo(p0.x, p0.y);
      cCtx.lineTo(p1.x, p1.y);
      cCtx.strokeStyle = `rgba(255, 208, 102, ${(alpha * 0.95).toFixed(3)})`;
      cCtx.lineWidth = w;
      cCtx.lineCap = 'round';
      cCtx.stroke();

      // White hot spine
      cCtx.beginPath();
      cCtx.moveTo(p0.x, p0.y);
      cCtx.lineTo(p1.x, p1.y);
      cCtx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`;
      cCtx.lineWidth = Math.max(0.5, w * 0.4);
      cCtx.lineCap = 'round';
      cCtx.stroke();
    }
    cCtx.restore();
  }

  // 2. Render Trailing Embers
  for (let i = state.cursor.embers.length - 1; i >= 0; i--) {
    const e = state.cursor.embers[i];
    e.x += e.vx;
    e.y += e.vy;
    e.alpha -= e.decay;

    if (e.alpha <= 0) {
      state.cursor.embers.splice(i, 1);
      continue;
    }

    cCtx.beginPath();
    cCtx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    cCtx.fillStyle = e.hue === 'gold'
      ? `rgba(255, 208, 102, ${e.alpha.toFixed(2)})`
      : `rgba(56, 189, 248, ${e.alpha.toFixed(2)})`;
    cCtx.fill();
  }

  const mouseDist = Math.hypot(state.cursor.targetX - state.cursor.x, state.cursor.targetY - state.cursor.y);
  if (mouseDist < 0.4 && state.cursor.history.length <= 1 && state.cursor.embers.length === 0) {
    isCursorActive = false;
  }
}

// ─── Scroll Synchronization & Video Scrubbing Engine ────────────────────────
function updateScroll() {
  const trackHeight = dom.scrollContainer ? dom.scrollContainer.offsetHeight : window.innerHeight * 9.5;
  const maxScroll = Math.max(trackHeight - window.innerHeight, 1);
  state.scroll.max = maxScroll;

  // Normalized progress within the cinematic container
  const rawT = window.scrollY / maxScroll;
  state.scroll.target = clamp(rawT, 0, 1);

  // Check if user has entered the operational headquarters
  const appTop = dom.appMain ? dom.appMain.getBoundingClientRect().top : 9999;
  state.scroll.inApp = appTop <= 50;

  if (Math.abs(state.scroll.target - state.scroll.current) > 0.0002 || state.scroll.inApp) {
    isCameraActive = true;
    wakeLoop();
  }
}

function scrubVideo(video, targetTime) {
  if (!video || video.readyState < 2) return;
  if (video.seeking) return;
  if (Math.abs(video.currentTime - targetTime) > 0.035) {
    video.currentTime = targetTime;
  }
}

function syncVideos(t) {
  // Gala Video: Scene B (Active in t in [0.36, 0.66])
  if (dom.galaVideo) {
    if (t >= 0.36 && t < 0.66 && !state.scroll.inApp) {
      const galaProg = clamp((t - 0.38) / 0.26, 0, 1);
      const targetTime = galaProg * 4.2;
      scrubVideo(dom.galaVideo, targetTime);
    } else if (dom.galaVideo.currentTime !== 0 && (t < 0.35 || state.scroll.inApp)) {
      dom.galaVideo.currentTime = 0;
    }
  }

  // Desert Video: Scene C (Active in t in [0.66, 1.00])
  if (dom.desertVideo) {
    if (t >= 0.66 && !state.scroll.inApp) {
      const desertProg = clamp((t - 0.70) / 0.30, 0, 1);
      const targetTime = desertProg * 7.8;
      scrubVideo(dom.desertVideo, targetTime);
    } else if (dom.desertVideo.currentTime !== 0 && (t < 0.64 || state.scroll.inApp)) {
      dom.desertVideo.currentTime = 0;
    }
  }
}

function updateCamera() {
  const damping = prefersReducedMotion() ? 1.0 : 0.08;
  state.scroll.current = lerp(state.scroll.current, state.scroll.target, damping);
  const t = state.scroll.current;

  if (Math.abs(state.scroll.target - state.scroll.current) < 0.0003) {
    state.scroll.current = state.scroll.target;
    isCameraActive = false;
  }

  // Update Scroll Fill Bar
  if (dom.scrollFill) {
    dom.scrollFill.style.width = `${(t * 100).toFixed(1)}%`;
  }

  // Stage Viewport Opacity: soften stage when inside application content
  if (dom.stageViewport) {
    if (state.scroll.inApp) {
      dom.stageViewport.style.opacity = '0.08';
    } else {
      dom.stageViewport.style.opacity = '1';
    }
  }

  let galaxyScale = 0.65;
  let galaxyOpacity = 0.12;
  let coreGlowOpacity = 0.25;
  let coreGlowScale = 0.8;
  let burstOpacity = 0;
  let burstScale = 0.65;

  let titleOpacity = 0;
  let titleScale = 0.88;
  let titleTranslateY = 24;
  let haloOpacity = 0;
  let sublineWidth = 0;
  let sublineOpacity = 0;

  let galaVideoOpacity = 0;
  let desertVideoOpacity = 0;
  let photonWashOpacity = 0;
  let goldenDawnOpacity = 0;

  let storyGala1Opacity = 0;
  let storyGala1Y = 28;
  let storyGala2Opacity = 0;
  let storyGala2Y = 28;
  let storyDesertCalloutOpacity = 0;
  let storyDesertCalloutY = 28;

  let houseAlphaOpacity = 0;
  let houseInferOpacity = 0;
  let houseMatrixOpacity = 0;
  let houseLayerOpacity = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE A1 — COSMIC INGRESS & TITLE EMERGENCE (t: 0.00 -> 0.22)
  // ═══════════════════════════════════════════════════════════════════════════
  if (t < 0.22) {
    const p = t / 0.22;

    galaxyScale = lerp(0.65, 2.85, Math.pow(p, 1.2));
    galaxyOpacity = lerp(0.12, 0.96, p);
    coreGlowOpacity = lerp(0.25, 0.90, p);
    coreGlowScale = lerp(0.8, 1.85, p);

    if (p > 0.60 && p < 0.88) {
      const bProg = (p - 0.60) / 0.28;
      burstOpacity = Math.sin(bProg * Math.PI) * 0.85;
      burstScale = lerp(0.7, 1.45, bProg);
    }

    if (p >= 0.68) {
      const tProg = (p - 0.68) / 0.32;
      titleOpacity = clamp(tProg * 1.3, 0, 1);
      titleScale = lerp(0.88, 1.0, tProg);
      titleTranslateY = lerp(24, 0, tProg);
      haloOpacity = clamp(tProg * 0.8, 0, 0.8);

      if (tProg > 0.35) {
        const sProg = (tProg - 0.35) / 0.65;
        sublineWidth = sProg * 100;
        sublineOpacity = sProg * 0.9;
      }
    }

    const dist = lerp(2.80, 0.048, p).toFixed(2);
    if (dom.coordinatesText) dom.coordinatesText.textContent = `DIST: ${dist}M LY // RA 12h 39m`;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE A2 — CINEMATIC TITLE HOLD (t: 0.22 -> 0.36)
  // Frozen presentation across ~120vh of deliberate scroll distance
  // ═══════════════════════════════════════════════════════════════════════════
  else if (t < 0.36) {
    galaxyScale = 2.85;
    galaxyOpacity = 0.96;
    coreGlowOpacity = 0.90;
    coreGlowScale = 1.85;
    burstOpacity = 0;

    titleOpacity = 1.0;
    titleScale = 1.0;
    titleTranslateY = 0;
    haloOpacity = 0.8;
    sublineWidth = 100;
    sublineOpacity = 0.9;

    if (dom.coordinatesText) dom.coordinatesText.textContent = `DIST: 227k LY // SINGULARITY STABLE`;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE B — GALAXY VIDEO SCRUBBING & TYPOGRAPHY (t: 0.36 -> 0.66)
  // ═══════════════════════════════════════════════════════════════════════════
  else if (t < 0.66) {
    const p = (t - 0.36) / 0.30;

    // Dissolve TACHYON title strictly before story typography
    if (p <= 0.16) {
      const dProg = p / 0.16;
      titleOpacity = clamp(1 - dProg, 0, 1);
      titleScale = lerp(1.0, 1.08, dProg);
      titleTranslateY = lerp(0, -24, dProg);
      haloOpacity = clamp(0.8 - dProg * 0.8, 0, 0.8);
      sublineOpacity = clamp(0.9 - dProg * 0.9, 0, 0.9);
    } else {
      titleOpacity = 0;
      haloOpacity = 0;
      sublineOpacity = 0;
    }

    galaVideoOpacity = clamp(p * 2.4, 0, 1);
    galaxyOpacity = clamp(1 - p * 1.8, 0, 1);

    // Story Card 1: Ingress (p: 0.20 -> 0.52)
    if (p >= 0.20 && p <= 0.52) {
      const s1Prog = (p - 0.20) / 0.32;
      storyGala1Opacity = Math.sin(s1Prog * Math.PI);
      storyGala1Y = lerp(20, -10, s1Prog);
    }

    // Story Card 2: Singularity (p: 0.55 -> 0.87)
    if (p >= 0.55 && p <= 0.87) {
      const s2Prog = (p - 0.55) / 0.32;
      storyGala2Opacity = Math.sin(s2Prog * Math.PI);
      storyGala2Y = lerp(20, -10, s2Prog);
    }

    if (p >= 0.78) {
      const fProg = (p - 0.78) / 0.22;
      photonWashOpacity = clamp(fProg * 1.35, 0, 1);
    }

    const vel = lerp(0.45, 0.98, p).toFixed(2);
    if (dom.coordinatesText) dom.coordinatesText.textContent = `CORE INGRESS // VEL: ${vel}c // RA 12h 44m`;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE C — DESERT VIDEO & FOUR HOUSES REVEAL (t: 0.66 -> 1.00)
  // ═══════════════════════════════════════════════════════════════════════════
  else {
    const p = (t - 0.66) / 0.34;

    photonWashOpacity = clamp(1 - p * 3.5, 0, 1);
    goldenDawnOpacity = clamp((1 - Math.abs(p - 0.22) * 2.2), 0, 0.85);

    desertVideoOpacity = clamp(p * 2.2, 0, 1);
    galaVideoOpacity = 0;
    galaxyOpacity = 0;

    // Story Card 3: "FOUR HOUSES. ONE COMPETITION." (p: 0.10 -> 0.44)
    if (p >= 0.10 && p <= 0.44) {
      const dCallProg = (p - 0.10) / 0.34;
      storyDesertCalloutOpacity = Math.sin(dCallProg * Math.PI);
      storyDesertCalloutY = lerp(24, -12, dCallProg);
    }

    // Story Card 4: Staggered Four Houses Reveal (p >= 0.46)
    if (p >= 0.46) {
      const hBaseProg = (p - 0.46) / 0.54;
      houseAlphaOpacity = clamp((hBaseProg - 0.00) / 0.25, 0, 1);
      houseInferOpacity = clamp((hBaseProg - 0.15) / 0.25, 0, 1);
      houseMatrixOpacity = clamp((hBaseProg - 0.30) / 0.25, 0, 1);
      houseLayerOpacity = clamp((hBaseProg - 0.45) / 0.25, 0, 1);
    }

    if (dom.coordinatesText) dom.coordinatesText.textContent = `SURFACE LEVEL // TERRA FIRMA // 4 HOUSES ACTIVE`;
  }

  syncVideos(t);

  // Apply GPU Transform Updates
  const rotateDeg = lerp(-6, 6, t);

  if (dom.galaxyImg) {
    dom.galaxyImg.style.transform = `scale(${galaxyScale.toFixed(3)}) rotate(${rotateDeg.toFixed(2)}deg)`;
    dom.galaxyImg.style.opacity = galaxyOpacity.toFixed(2);
  }

  if (dom.galaxyGlow) {
    dom.galaxyGlow.style.opacity = coreGlowOpacity.toFixed(2);
    dom.galaxyGlow.style.transform = `scale(${coreGlowScale.toFixed(2)})`;
  }

  if (dom.galaVideo) dom.galaVideo.style.opacity = galaVideoOpacity.toFixed(2);
  if (dom.desertVideo) dom.desertVideo.style.opacity = desertVideoOpacity.toFixed(2);
  if (dom.photonWash) dom.photonWash.style.opacity = photonWashOpacity.toFixed(2);
  if (dom.goldenDawnHaze) dom.goldenDawnHaze.style.opacity = goldenDawnOpacity.toFixed(2);

  if (dom.cosmicBurst) {
    if (burstOpacity > 0.01) {
      dom.cosmicBurst.style.visibility = 'visible';
      dom.cosmicBurst.style.opacity = burstOpacity.toFixed(2);
      dom.cosmicBurst.style.transform = `scale(${burstScale.toFixed(2)})`;
    } else {
      dom.cosmicBurst.style.visibility = 'hidden';
      dom.cosmicBurst.style.opacity = '0';
    }
  }

  if (dom.monumentContainer) {
    if (titleOpacity > 0.005) {
      dom.monumentContainer.style.visibility = 'visible';
      dom.monumentContainer.style.opacity = titleOpacity.toFixed(2);
      dom.monumentContainer.style.transform = `scale(${titleScale.toFixed(3)}) translateY(${titleTranslateY.toFixed(1)}px)`;
    } else {
      dom.monumentContainer.style.visibility = 'hidden';
      dom.monumentContainer.style.opacity = '0';
    }
  }

  if (dom.monumentHalo) dom.monumentHalo.style.opacity = haloOpacity.toFixed(2);
  if (dom.monumentSubline) {
    dom.monumentSubline.style.width = `${sublineWidth.toFixed(0)}%`;
    dom.monumentSubline.style.opacity = sublineOpacity.toFixed(2);
  }

  if (dom.storyGala1) {
    dom.storyGala1.style.opacity = storyGala1Opacity.toFixed(2);
    dom.storyGala1.style.transform = `translateY(${storyGala1Y.toFixed(1)}px)`;
  }
  if (dom.storyGala2) {
    dom.storyGala2.style.opacity = storyGala2Opacity.toFixed(2);
    dom.storyGala2.style.transform = `translateY(${storyGala2Y.toFixed(1)}px)`;
  }
  if (dom.storyDesertCallout) {
    dom.storyDesertCallout.style.opacity = storyDesertCalloutOpacity.toFixed(2);
    dom.storyDesertCallout.style.transform = `translateY(${storyDesertCalloutY.toFixed(1)}px)`;
  }

  if (dom.storyHouses) {
    dom.storyHouses.style.opacity = houseAlphaOpacity > 0 ? '1' : '0';
  }
  if (dom.houseAlpha) {
    dom.houseAlpha.style.opacity = houseAlphaOpacity.toFixed(2);
    dom.houseAlpha.style.transform = `translateY(${lerp(18, 0, houseAlphaOpacity).toFixed(1)}px)`;
  }
  if (dom.houseInfer) {
    dom.houseInfer.style.opacity = houseInferOpacity.toFixed(2);
    dom.houseInfer.style.transform = `translateY(${lerp(18, 0, houseInferOpacity).toFixed(1)}px)`;
  }
  if (dom.houseMatrix) {
    dom.houseMatrix.style.opacity = houseMatrixOpacity.toFixed(2);
    dom.houseMatrix.style.transform = `translateY(${lerp(18, 0, houseMatrixOpacity).toFixed(1)}px)`;
  }
  if (dom.houseLayer) {
    dom.houseLayer.style.opacity = houseLayerOpacity.toFixed(2);
    dom.houseLayer.style.transform = `translateY(${lerp(18, 0, houseLayerOpacity).toFixed(1)}px)`;
  }
}

// ─── Render Loop ────────────────────────────────────────────────────────────
let isTabVisible = true;
let isCameraActive = true;
let isCursorActive = false;
let rafId = null;

function renderLoop(timestamp) {
  if (isCameraActive) updateCamera();
  renderParticles(state.scroll.current, timestamp);
  renderCursorTail(timestamp);

  if (isTabVisible && (isCameraActive || isCursorActive || !state.scroll.inApp)) {
    rafId = requestAnimationFrame(renderLoop);
  } else {
    rafId = null;
  }
}

function wakeLoop() {
  if (!rafId && isTabVisible) {
    rafId = requestAnimationFrame(renderLoop);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND API INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

// ─── 1. Standings & Pillars ────────────────────────────────────────────────
function renderPillars(houses) {
  const maxScore = Math.max(...houses.map(h => h.score), 1);

  houses.forEach(({ house, score, rank }) => {
    const bar = dom.bars[house];
    const scoreEl = dom.scores[house];
    const rankEl = dom.rankTags[house];
    if (!bar || !scoreEl) return;

    const pct = score > 0 ? Math.max((score / maxScore) * 100, 6) : 2;
    bar.style.height = `${pct}%`;
    scoreEl.textContent = score.toLocaleString();
    if (rankEl) rankEl.textContent = `Rank #${rank}`;
  });
}

function renderRankTable(houses) {
  if (!dom.rankBody) return;

  const rows = houses.map(({ rank, house, score }) => {
    const meta = HOUSE_META[house] || { name: house, tag: '', glyph: '', pip: '' };
    const isTop = rank === 1 && score > 0;
    return `
      <tr>
        <td class="td-rank">
          <span class="td-rank-badge ${isTop ? 'td-rank-1' : ''}">${ordinal(rank)}</span>
        </td>
        <td>
          <div class="house-table-cell">
            <span class="house-badge-pip ${meta.pip}" aria-hidden="true"></span>
            <div>
              <div class="house-table-name">${meta.name}</div>
              <div class="house-tag">${meta.tag}</div>
            </div>
          </div>
        </td>
        <td class="th-score">
          <span class="house-table-score">${score.toLocaleString()}</span>
        </td>
      </tr>`;
  }).join('');

  dom.rankBody.innerHTML = rows;
}

function renderWinner(winners) {
  if (!dom.winnerBanner || !dom.winnerName) return;

  if (!winners || winners.length === 0) {
    dom.winnerBanner.hidden = true;
    return;
  }

  const names = winners
    .map(h => HOUSE_META[h]?.name ?? h)
    .join(' & ');

  dom.winnerName.textContent = names;
  const labelEl = dom.winnerBanner.querySelector('.winner-banner__label');
  if (labelEl) {
    labelEl.textContent = winners.length === 1 ? 'Leading House' : 'Co-leading Houses';
  }
  dom.winnerBanner.hidden = false;
}

async function fetchLeaderboard() {
  if (dom.lbError) dom.lbError.hidden = true;

  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data.houses && Array.isArray(data.houses)) {
      renderPillars(data.houses);
      renderRankTable(data.houses);
      renderWinner(data.winners);
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    if (dom.lbError) {
      dom.lbError.textContent = 'Could not load live leaderboard from backend. Retrying automatically...';
      dom.lbError.hidden = false;
    }
  }
}

// ─── 2. Event History Audit Ledger ─────────────────────────────────────────
function renderHistory(events) {
  if (!dom.historyList) return;

  if (!events || events.length === 0) {
    dom.historyList.innerHTML = `
      <div class="history-empty">
        <span>No point events recorded yet. Award points above to initiate competition!</span>
      </div>`;
    return;
  }

  // Display newest events first
  const sorted = [...events].reverse();

  const items = sorted.map(ev => {
    const meta = HOUSE_META[ev.house] || { name: ev.house, pill: '' };
    return `
      <div class="history-item" role="listitem">
        <span class="history-house-pill ${meta.pill}">${meta.name}</span>
        <div class="history-item__body">
          <p class="history-item__reason">${escapeHtml(ev.reason)}</p>
          <time class="history-item__time" datetime="${ev.recorded_at}">
            ${formatTime(ev.recorded_at)}
          </time>
        </div>
        <span class="history-item__points">+${ev.points} PTS</span>
      </div>`;
  }).join('');

  dom.historyList.innerHTML = items;
}

async function fetchHistory() {
  if (dom.historyError) dom.historyError.hidden = true;

  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    renderHistory(data.events);
  } catch (err) {
    console.error('Failed to load event history:', err);
    if (dom.historyError) {
      dom.historyError.textContent = 'Could not load event history ledger from backend.';
      dom.historyError.hidden = false;
    }
  }
}

// ─── 3. Award Points Form Submission ───────────────────────────────────────
function setFormLoading(isLoading) {
  if (!dom.submitBtn) return;
  dom.submitBtn.disabled = isLoading;
  if (dom.btnSpinner) dom.btnSpinner.hidden = !isLoading;
  if (dom.btnText) {
    dom.btnText.textContent = isLoading ? 'Recording Points...' : 'Submit Point Award';
  }
}

function showFormStatus(message, isSuccess = true) {
  if (!dom.formStatus) return;
  dom.formStatus.className = `form-status ${isSuccess ? 'form-status--success' : 'form-status--error'}`;
  dom.formStatus.textContent = message;
  dom.formStatus.style.display = 'block';
}

function clearFormErrors() {
  if (dom.houseError) dom.houseError.hidden = true;
  if (dom.pointsError) dom.pointsError.hidden = true;
  if (dom.reasonError) dom.reasonError.hidden = true;
  if (dom.pointsInput) dom.pointsInput.classList.remove('form-input--error');
  if (dom.reasonInput) dom.reasonInput.classList.remove('form-input--error');
}

function validateAwardForm() {
  clearFormErrors();
  let isValid = true;

  const houseRadio = dom.awardForm.querySelector('input[name="house"]:checked');
  if (!houseRadio) {
    if (dom.houseError) dom.houseError.hidden = false;
    isValid = false;
  }

  const pointsRaw = dom.pointsInput.value.trim();
  const pointsVal = Number(pointsRaw);
  if (pointsRaw === '' || !Number.isInteger(pointsVal) || pointsVal <= 0) {
    if (dom.pointsError) dom.pointsError.hidden = false;
    if (dom.pointsInput) dom.pointsInput.classList.add('form-input--error');
    isValid = false;
  }

  const reasonVal = dom.reasonInput.value.trim();
  if (reasonVal === '') {
    if (dom.reasonError) dom.reasonError.hidden = false;
    if (dom.reasonInput) dom.reasonInput.classList.add('form-input--error');
    isValid = false;
  }

  return isValid;
}

async function handleAwardSubmit(e) {
  e.preventDefault();
  if (!validateAwardForm()) return;

  const houseRadio = dom.awardForm.querySelector('input[name="house"]:checked');
  const house = houseRadio.value;
  const points = parseInt(dom.pointsInput.value.trim(), 10);
  const reason = dom.reasonInput.value.trim();

  setFormLoading(true);

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ house, points, reason }),
    });

    const data = await res.json();

    if (res.status === 201) {
      showFormStatus(`✓ Awarded +${points} points to House ${HOUSE_META[house]?.name ?? house} successfully!`, true);
      
      // Reset inputs
      dom.pointsInput.value = '';
      dom.reasonInput.value = '';
      if (dom.reasonCount) dom.reasonCount.textContent = '0 / 200';
      if (houseRadio) houseRadio.checked = false;

      // Refresh authoritative data from backend immediately
      await Promise.all([
        fetchLeaderboard(),
        fetchHistory(),
      ]);
    } else {
      const errMsg = data.error || `Server responded with HTTP ${res.status}`;
      showFormStatus(`Failed to award points: ${errMsg}`, false);
    }
  } catch (err) {
    console.error('Submission error:', err);
    showFormStatus(`Network error while communicating with backend: ${err.message}`, false);
  } finally {
    setFormLoading(false);
  }
}

// ─── Setup Event Listeners & Initialize ─────────────────────────────────────
function initEventListeners() {
  window.addEventListener('resize', () => {
    resizeCanvases();
    initParticles();
    updateScroll();
  }, { passive: true });

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
      isCameraActive = true;
      wakeLoop();
    }
  });

  // Reason textarea character counter
  if (dom.reasonInput && dom.reasonCount) {
    dom.reasonInput.addEventListener('input', () => {
      dom.reasonCount.textContent = `${dom.reasonInput.value.length} / 200`;
    });
  }

  // Award points form submit
  if (dom.awardForm) {
    dom.awardForm.addEventListener('submit', handleAwardSubmit);
  }

  // Smooth scroll for HUD nav links
  document.querySelectorAll('.hud-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Back to top button
  if (dom.backToTop) {
    dom.backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ─── Boot Sequence ──────────────────────────────────────────────────────────
function init() {
  resizeCanvases();
  initParticles();
  initCustomCursor();
  initEventListeners();
  updateScroll();
  wakeLoop();

  // Load backend data immediately
  fetchLeaderboard();
  fetchHistory();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
