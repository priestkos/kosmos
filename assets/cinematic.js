/**
 * K'OS MOS CINEMATIC CONTROLLER & 3D ENGINE
 * - WebGL 3D Parametric Constellation (Three.js) morphing across scroll stages:
 *   [Kitsune Sigil -> Celestial Harp -> Nine Tails Fan -> Starlight Prism -> Cosmic Vortex]
 * - Multi-Plane Split Depth & 3D Tilt Parallax Tracking
 * - Web Audio Celestial Soundscape Synthesizer
 * - Dynamic Scrollytelling Section Triggers & Active State Management
 * - High-Res 4K Image Lightbox
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. WEB AUDIO API SYNTHESIZER (Celestial Foxfire Ambient Drone & Harp)
  // =========================================================================
  class CelestialSoundscape {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.masterGain = null;
      this.oscillators = [];
      this.filter = null;
    }

    init() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low pass resonant filter for soft celestial warmth
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Celestial Drone Chords (D Minor Harmonic: D2, A2, D3, F3, A3, C#4)
      const freqs = [73.42, 110.00, 146.83, 174.61, 220.00, 277.18];
      
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Subtle slow pitch drifting LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        const baseAmp = 0.12 / freqs.length;
        oscGain.gain.setValueAtTime(baseAmp, this.ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(this.filter);
        osc.start();
        this.oscillators.push(osc);
      });
    }

    toggle() {
      if (!this.ctx) this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.isPlaying = !this.isPlaying;
      const now = this.ctx.currentTime;

      if (this.isPlaying) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.35, now + 2.5);
      } else {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 1.2);
      }
      return this.isPlaying;
    }

    // Trigger subtle crystal harp chime on section transitions
    playChime(pitchMultiplier = 1) {
      if (!this.ctx || !this.isPlaying) return;
      try {
        const now = this.ctx.currentTime;
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(587.33 * pitchMultiplier, now); // D5
        chimeGain.gain.setValueAtTime(0.08, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.masterGain);
        chimeOsc.start(now);
        chimeOsc.stop(now + 2.8);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 2. THREE.JS 3D CONSTELLATION ENGINE
  // =========================================================================
  const PARTICLE_COUNT = 2200;
  let scene, camera, renderer;
  let pointsGeometry, pointsMaterial, particleSystem;
  let linesGeometry, linesMaterial, lineSegments;

  let currentPositions, targetPositions;
  let colors, sizes;

  // Shapes registry
  const shapes = {
    fox: new Float32Array(PARTICLE_COUNT * 3),
    harp: new Float32Array(PARTICLE_COUNT * 3),
    fan: new Float32Array(PARTICLE_COUNT * 3),
    prism: new Float32Array(PARTICLE_COUNT * 3),
    sphere: new Float32Array(PARTICLE_COUNT * 3)
  };

  const SHAPE_NAMES = {
    fox: 'CELESTIAL EMBLEM',
    harp: 'CELESTIAL HARP',
    fan: 'NINE TAILS FAN',
    prism: 'STARLIGHT PRISM',
    sphere: 'ASTRAL VORTEX'
  };

  let activeShapeKey = 'fox';
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollProgress = 0;

  // --- Algorithmic Shape Generators ---
  // Act 01 Prologue: The sacred trinity emblem - Sweeping Fox Tail, Central Ascending Arrow, and Recurve Bow with Treble Clef Harp
  function generateFox(buf) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = (Math.random() - 0.5) * 16;

      if (i < PARTICLE_COUNT * 0.44) {
        // --- 1. SWEEPING CURVED FOX TAIL (Left flank: x: -55 to -8, y: -75 to +68) ---
        // Organic S-curve with halftone dot distribution tapering toward white feather tip
        const t = Math.random(); // 0 root, 1 tip
        // Cubic spine for the graceful plume
        const spineX = -32 - Math.sin(t * Math.PI * 0.95) * 26 + Math.pow(t, 2) * 16;
        const spineY = -74 + t * 142;

        // Plume thickness varies: narrow at base (-74), swelling broadly in middle, tapering to sharp tip (+68)
        const plumeWidth = Math.sin(t * Math.PI) * (18 + (1 - t) * 12);
        const plumeOffset = (Math.random() - 0.5) * 2 * plumeWidth;

        // Halftone dot dispersion density: dense at base/belly, sparse stippled at crest
        x = spineX + plumeOffset;
        y = spineY + (Math.random() - 0.5) * 6;
        z = Math.sin(t * Math.PI) * 12 + (Math.random() - 0.5) * 10;
      } else if (i < PARTICLE_COUNT * 0.68) {
        // --- 2. CENTRAL ASCENDING ARROW (Center spine: x: 0, y: -80 to +75) ---
        const sub = Math.random();
        if (sub < 0.65) {
          // Shaft & fletching
          const t = Math.random();
          x = (Math.random() - 0.5) * 3.2;
          y = -78 + t * 138;
          z = (Math.random() - 0.5) * 6;
          // Feathered fletchings at base
          if (t < 0.16) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const fletchT = t / 0.16;
            x = side * (2.5 + (1 - fletchT) * 10);
            y = -78 + fletchT * 22;
          }
        } else {
          // Triangular Arrowhead crest pointing skyward (y: 60 to 76)
          const t = Math.random(); // 0 base of barb, 1 apex
          const side = Math.random() > 0.5 ? 1 : -1;
          const barbWidth = (1 - t) * 14;
          x = side * Math.random() * barbWidth;
          y = 60 + t * 16;
          z = (Math.random() - 0.5) * 6;
        }
      } else {
        // --- 3. RECURVE BOW WITH HARP STRINGS & TREBLE CLEF (Right flank: x: +8 to +58, y: -75 to +75) ---
        const sub = Math.random();
        if (sub < 0.45) {
          // Recurve Bow Outer Limbs
          const t = (Math.random() - 0.5) * 2; // -1 bottom tip to +1 top tip
          const limbCurve = Math.cos(t * Math.PI * 0.5);
          x = 22 + limbCurve * 32 + Math.sin(t * Math.PI) * 8;
          y = t * 76;
          z = (Math.random() - 0.5) * 10;
        } else if (sub < 0.75) {
          // Integrated Treble Clef Grip / Inner Loop Heart (Center handle x: 20 to 36, y: -22 to +25)
          const angle = Math.random() * Math.PI * 3.5;
          const rad = 5 + (angle / (Math.PI * 3.5)) * 14;
          x = 26 + Math.cos(angle) * rad;
          y = -4 + Math.sin(angle) * rad * 1.5;
          z = (Math.random() - 0.5) * 8;
        } else {
          // Taut Bowstring & Parallel Resonant Harp Chords (Vertical chords between bow tips)
          const chordIdx = Math.floor(Math.random() * 5);
          const chordX = 14 + chordIdx * 3.8;
          const t = Math.random();
          x = chordX + (Math.random() - 0.5) * 1.8;
          y = -68 + t * 136;
          z = (Math.random() - 0.5) * 6;
        }
      }

      buf[idx] = x * 1.25;
      buf[idx + 1] = y * 1.25;
      buf[idx + 2] = z * 1.25;
    }
  }

  function generateHarp(buf) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = (Math.random() - 0.5) * 35;

      if (i < PARTICLE_COUNT * 0.45) {
        // Sweeping Curved Harp / Bow Frame
        const t = (i / (PARTICLE_COUNT * 0.45)) * Math.PI * 1.25 - 0.2;
        const r = 85 + Math.sin(t * 2) * 15;
        x = Math.cos(t) * r * 0.8 - 25;
        y = Math.sin(t) * r * 1.15;
        z = Math.sin(t * 3) * 20;
      } else if (i < PARTICLE_COUNT * 0.85) {
        // Resonant Strings (Parallel luminous lines)
        const stringIdx = Math.floor(Math.random() * 9);
        const strX = -35 + stringIdx * 9.5;
        const t = Math.random();
        const topY = 70 - stringIdx * 3.5;
        const botY = -75 + stringIdx * 5.5;
        x = strX + (Math.random() - 0.5) * 3;
        y = botY + t * (topY - botY);
        z = Math.sin(t * Math.PI) * 18 * Math.sin(Date.now() * 0.002 + stringIdx);
      } else {
        // Celestial Notes & Sparkle Dust
        const a = Math.random() * Math.PI * 2;
        const d = 40 + Math.random() * 70;
        x = Math.cos(a) * d + 20;
        y = Math.sin(a) * d;
        z = (Math.random() - 0.5) * 60;
      }

      buf[idx] = x * 1.25;
      buf[idx + 1] = y * 1.25;
      buf[idx + 2] = z * 1.25;
    }
  }

  function generateFan(buf) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const tailIdx = i % 9; // 9 Distinct Tails
      const tailAngle = ((tailIdx - 4) / 4.5) * (Math.PI * 0.42);
      const t = Math.random(); // 0 root, 1 tip

      const spread = Math.sin(t * Math.PI) * (18 + Math.random() * 12);
      const radius = 25 + Math.pow(t, 1.2) * 120;

      const angle = tailAngle + (Math.sin(t * 4) * 0.15);
      const x = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
      const y = -65 + Math.cos(angle) * radius * 0.95;
      const z = Math.sin(tailIdx + t * 3) * 30 + (Math.random() - 0.5) * 20;

      buf[idx] = x * 1.2;
      buf[idx + 1] = y * 1.2;
      buf[idx + 2] = z * 1.2;
    }
  }

  function generatePrism(buf) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const phi = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 130;
      const r = (1 - Math.abs(h) / 75) * 65;

      const edgeSnap = Math.round(phi / (Math.PI / 3)) * (Math.PI / 3);
      const blendedPhi = Math.random() > 0.4 ? edgeSnap : phi;

      const x = Math.cos(blendedPhi) * Math.max(0, r) + (Math.random() - 0.5) * 6;
      const y = h;
      const z = Math.sin(blendedPhi) * Math.max(0, r) + (Math.random() - 0.5) * 6;

      buf[idx] = x * 1.35;
      buf[idx + 1] = y * 1.35;
      buf[idx + 2] = z * 1.35;
    }
  }

  function generateSphere(buf) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 70 + Math.cbrt(Math.random()) * 25;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      buf[idx] = x * 1.35;
      buf[idx + 1] = y * 1.35;
      buf[idx + 2] = z * 1.35;
    }
  }

  function initThree() {
    const container = document.getElementById('webgl-stage');
    const canvas = document.getElementById('webgl-canvas');
    if (!container || !canvas || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07080c, 0.0028);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(0, 0, 140);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Generate Buffers
    generateFox(shapes.fox);
    generateHarp(shapes.harp);
    generateFan(shapes.fan);
    generatePrism(shapes.prism);
    generateSphere(shapes.sphere);

    currentPositions = new Float32Array(PARTICLE_COUNT * 3);
    targetPositions = new Float32Array(shapes.fox);
    currentPositions.set(shapes.fox);

    colors = new Float32Array(PARTICLE_COUNT * 3);
    sizes = new Float32Array(PARTICLE_COUNT);

    const cCrimson = new THREE.Color(0xff2a44);
    const cGold = new THREE.Color(0xf5b041);
    const cAmber = new THREE.Color(0xe07a3c);
    const cCream = new THREE.Color(0xf7ecd5);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      let col;

      if (i < PARTICLE_COUNT * 0.44) {
        // Fox Tail: Warm cream-white at tip, shifting through amber into glowing foxfire crimson-gold
        const t = (i / (PARTICLE_COUNT * 0.44));
        if (t > 0.8) col = cCream;
        else if (t > 0.45) col = cAmber;
        else if (t > 0.2) col = cCrimson;
        else col = cGold;
        sizes[i] = 1.8 + Math.random() * 3.4;
      } else if (i < PARTICLE_COUNT * 0.68) {
        // Ascending Arrow: Pure piercing starlight white & gold shaft
        col = Math.random() > 0.25 ? cWhite : cGold;
        sizes[i] = 1.6 + Math.random() * 2.2;
      } else {
        // Recurve Bow & Harp Chords: Gilded celestial bronze, warm amber, and resonant crimson
        const r = Math.random();
        if (r < 0.4) col = cGold;
        else if (r < 0.7) col = cAmber;
        else if (r < 0.88) col = cCrimson;
        else col = cWhite;
        sizes[i] = 1.5 + Math.random() * 2.6;
      }

      colors[idx] = col.r;
      colors[idx + 1] = col.g;
      colors[idx + 2] = col.b;
    }

    pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture via Canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,210,120,0.85)');
    grad.addColorStop(0.65, 'rgba(255,42,68,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);

    const pTex = new THREE.CanvasTexture(pCanvas);

    pointsMaterial = new THREE.PointsMaterial({
      size: 3.2,
      map: pTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.92
    });

    particleSystem = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(particleSystem);

    // Luminous Connecting Filaments (Line Segments)
    const MAX_LINE_SEGS = 680;
    const linePos = new Float32Array(MAX_LINE_SEGS * 2 * 3);
    linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

    linesMaterial = new THREE.LineBasicMaterial({
      color: 0xf5b041,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    lineSegments = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lineSegments);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }

  function switchConstellation(shapeKey) {
    if (!shapes[shapeKey] || activeShapeKey === shapeKey) return;
    activeShapeKey = shapeKey;
    targetPositions = shapes[shapeKey];

    const hudEl = document.getElementById('hud-constellation');
    if (hudEl) hudEl.textContent = SHAPE_NAMES[shapeKey] || 'CELESTIAL HARMONIC';

    if (window.soundscape) {
      window.soundscape.playChime(shapeKey === 'fox' ? 1.0 : shapeKey === 'harp' ? 1.25 : 1.5);
    }
  }

  // --- Main Animation Loop ---
  let animClock = 0;
  function animate() {
    requestAnimationFrame(animate);
    animClock += 0.012;

    // Smooth pointer damping
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    if (particleSystem && currentPositions && targetPositions) {
      // Morph particles toward target formation
      const posAttr = pointsGeometry.attributes.position;
      const count = PARTICLE_COUNT * 3;
      const lerpSpeed = 0.048;

      for (let i = 0; i < count; i += 3) {
        currentPositions[i] += (targetPositions[i] - currentPositions[i]) * lerpSpeed;
        currentPositions[i + 1] += (targetPositions[i + 1] - currentPositions[i + 1]) * lerpSpeed;
        currentPositions[i + 2] += (targetPositions[i + 2] - currentPositions[i + 2]) * lerpSpeed;

        // Subtle organic breathing foxfire flutter
        currentPositions[i + 1] += Math.sin(animClock * 2.5 + i) * 0.14;
      }
      posAttr.needsUpdate = true;

      // Subtle slow scene rotation + pointer tilt
      particleSystem.rotation.y = animClock * 0.12 + mouse.x * 0.35;
      particleSystem.rotation.x = Math.sin(animClock * 0.08) * 0.1 - mouse.y * 0.25;

      lineSegments.rotation.y = particleSystem.rotation.y;
      lineSegments.rotation.x = particleSystem.rotation.x;

      // Dynamic Connecting Lines between nearby stars
      const lineAttr = linesGeometry.attributes.position;
      const lPos = lineAttr.array;
      let lIdx = 0;
      const MAX_LINE_VERTS = 680 * 2 * 3;
      const distThresholdSq = 360;

      // Sample a subset for performance
      for (let i = 0; i < 480 && lIdx < MAX_LINE_VERTS; i += 3) {
        const i3 = i * 3;
        const x1 = currentPositions[i3];
        const y1 = currentPositions[i3 + 1];
        const z1 = currentPositions[i3 + 2];

        for (let j = i + 1; j < i + 18 && lIdx < MAX_LINE_VERTS; j++) {
          const j3 = j * 3;
          const dx = x1 - currentPositions[j3];
          const dy = y1 - currentPositions[j3 + 1];
          const dz = z1 - currentPositions[j3 + 2];
          const dSq = dx * dx + dy * dy + dz * dz;

          if (dSq < distThresholdSq) {
            lPos[lIdx++] = x1;
            lPos[lIdx++] = y1;
            lPos[lIdx++] = z1;
            lPos[lIdx++] = currentPositions[j3];
            lPos[lIdx++] = currentPositions[j3 + 1];
            lPos[lIdx++] = currentPositions[j3 + 2];
          }
        }
      }
      // Fill remainder with zeroes
      while (lIdx < MAX_LINE_VERTS) {
        lPos[lIdx++] = 0;
      }
      lineAttr.needsUpdate = true;

      // Camera parallax scroll depth & progressive focus blur at bottom
      camera.position.z = 140 - scrollProgress * 25;
      camera.position.x = mouse.x * 12;
      camera.position.y = mouse.y * 8;
      camera.lookAt(0, 0, 0);

      // Dynamically soften and expand point sizes near the bottom to create a smooth out-of-focus bokeh
      if (pointsMaterial) {
        // Base size 3.2 at top, expanding to 6.8 at bottom for diffuse blurry bokeh
        pointsMaterial.size = 3.2 + scrollProgress * 3.6;
        // Fade opacity slightly at bottom so text stays ultra-crisp
        pointsMaterial.opacity = 0.92 - scrollProgress * 0.42;
      }
      if (linesMaterial) {
        // Soften lines toward bottom
        linesMaterial.opacity = 0.28 * (1 - scrollProgress * 0.65);
      }

      const depthHud = document.getElementById('hud-depth');
      if (depthHud) depthHud.textContent = `Z: ${(camera.position.z).toFixed(1)}`;
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // =========================================================================
  // 3. SCROLLYTELLING CONTROLLER & SECTION INTERSECTION OBSERVER
  // =========================================================================
  function initScrollytelling() {
    const sections = document.querySelectorAll('.story-section');
    const navLinks = document.querySelectorAll('.chapter-link');
    const railDots = document.querySelectorAll('.rail-dot');
    const progressBar = document.getElementById('scroll-progress-line');

    function updateScrollMetrics() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      if (progressBar) {
        progressBar.style.width = `${(scrollProgress * 100).toFixed(2)}%`;
      }

      // Parallax elements with [data-parallax]
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const factor = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top - window.innerHeight * 0.5) * factor;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    }

    window.addEventListener('scroll', updateScrollMetrics, { passive: true });

    // IntersectionObserver for active chapters & shape morphs
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: [0.1, 0.4]
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const shapeKey = entry.target.getAttribute('data-shape') || 'fox';

          // Trigger 3D constellation shape morph
          switchConstellation(shapeKey);

          // Update Topbar Chapter Nav
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });

          // Update Quick Rail Dots
          railDots.forEach(dot => {
            if (dot.getAttribute('data-target') === sectionId) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(s => sectionObserver.observe(s));

    // Rail Dot Click Handler
    railDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const targetId = dot.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // =========================================================================
  // 4. INTERACTIVE 3D TILT & SPLIT DEPTH ENGINE
  // =========================================================================
  function init3DTiltAndSplitDepth() {
    // 1. Tilt Cards ([data-tilt])
    const tiltElements = document.querySelectorAll('[data-tilt]');
    tiltElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const tiltX = -y * 14;
        const tiltY = x * 14;

        el.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });

    // 2. Award-Winning Split-Depth Multi-Plane Perspective Stages
    const splitStages = document.querySelectorAll('[data-split-stage]');
    splitStages.forEach(stage => {
      const wrapper = stage.querySelector('.split-frame-wrapper');
      const deepBg = stage.querySelector('.layer-deep-bg');
      const leftBar = stage.querySelector('.depth-bar-left');
      const rightBar = stage.querySelector('.depth-bar-right');
      const subject = stage.querySelector('.layer-subject-popout');

      if (!wrapper || !deepBg || !subject) return;

      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;

        // Plane 1: Deep Background shifts AWAY (Parallax Depth: -22px)
        deepBg.style.transform = `scale(1.08) translate3d(${(-nx * 24).toFixed(1)}px, ${(-ny * 18).toFixed(1)}px, 0)`;

        // Plane 2: Depth Anchor Bars shift slightly (Mid-plane: 6px)
        if (leftBar) leftBar.style.transform = `translate3d(${(nx * 6).toFixed(1)}px, 0, 0)`;
        if (rightBar) rightBar.style.transform = `translate3d(${(nx * 6).toFixed(1)}px, 0, 0)`;

        // Plane 3: Popout Foreground Subject LAPS FORWARD over bars (Foreground Pop: +34px)
        subject.style.transform = `scale(1.06) translate3d(${(nx * 32).toFixed(1)}px, ${(ny * 22).toFixed(1)}px, 0)`;
      });

      wrapper.addEventListener('mouseleave', () => {
        deepBg.style.transform = 'scale(1.05) translate3d(0, 0, 0)';
        if (leftBar) leftBar.style.transform = 'translate3d(0, 0, 0)';
        if (rightBar) rightBar.style.transform = 'translate3d(0, 0, 0)';
        subject.style.transform = 'scale(1.02) translate3d(0, 0, 0)';
      });
    });
  }

  // =========================================================================
  // 5. TRAIT SELECTOR & HARMONIC SHIFT
  // =========================================================================
  function initTraitSelector() {
    const buttons = document.querySelectorAll('.trait-btn');
    const cards = document.querySelectorAll('.trait-card');

    buttons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (cards[idx]) {
          cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (window.soundscape) {
          window.soundscape.playChime(1.1 + idx * 0.15);
        }
      });
    });
  }

  // =========================================================================
  // 6. 4K CINEMATIC LIGHTBOX
  // =========================================================================
  function initLightbox() {
    const modal = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbIdx = document.getElementById('lightbox-idx');
    const lbTitle = document.getElementById('lightbox-title');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const backdrop = document.querySelector('.lightbox-backdrop');

    const tiles = Array.from(document.querySelectorAll('.cinematic-tile'));
    let currentIndex = 0;

    function openAt(idx) {
      if (idx < 0) idx = tiles.length - 1;
      if (idx >= tiles.length) idx = 0;
      currentIndex = idx;

      const tile = tiles[currentIndex];
      const imgSrc = tile.getAttribute('data-img');
      const idxText = tile.querySelector('.tile-idx')?.textContent || `EXHIBIT ${currentIndex + 1}`;
      const titleText = tile.querySelector('.tile-title')?.textContent || 'Portrait';

      lbImg.src = imgSrc;
      lbIdx.textContent = idxText;
      lbTitle.textContent = titleText;

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';

      if (window.soundscape) window.soundscape.playChime(1.4);
    }

    function close() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    tiles.forEach((tile, idx) => {
      tile.addEventListener('click', () => openAt(idx));
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => openAt(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => openAt(currentIndex + 1));

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') openAt(currentIndex - 1);
      else if (e.key === 'ArrowRight') openAt(currentIndex + 1);
    });
  }

  // =========================================================================
  // 7. AMBIENT AUDIO PILL TRIGGER
  // =========================================================================
  function initAudioPill() {
    const pill = document.getElementById('audio-pill');
    const label = pill?.querySelector('.audio-label');
    window.soundscape = new CelestialSoundscape();

    if (pill && label) {
      pill.addEventListener('click', () => {
        const isPlaying = window.soundscape.toggle();
        if (isPlaying) {
          pill.classList.add('playing');
          label.textContent = 'SOUND: ON';
        } else {
          pill.classList.remove('playing');
          label.textContent = 'SOUND: OFF';
        }
      });
    }
  }

  // =========================================================================
  // INITIALIZATION ON DOM READY
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initThree();
    animate();
    initScrollytelling();
    init3DTiltAndSplitDepth();
    initTraitSelector();
    initLightbox();
    initAudioPill();
  });

})();
