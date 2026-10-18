/**
 * K'OS MOS CONTROLLER & 3D ENGINE
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
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output gain for ambient continuous drone chords
      this.masterGain = this.ctx.createGain();
      // Sound stays silent until the visitor turns it on.
      const initialGain = this.isPlaying ? 0.35 : 0;
      this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated chime output gain connected directly to destination
      // Volume remains perfectly stable and constant, never dropping off as user scrolls
      this.chimeGain = this.ctx.createGain();
      this.chimeGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.chimeGain.connect(this.ctx.destination);

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

      // Automatically resume context on first real user gesture anywhere on the page
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
          window.removeEventListener(ev, unlockAudio, true);
        });
      };
      ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
        window.addEventListener(ev, unlockAudio, { passive: true, capture: true });
      });
    }

    toggle() {
      if (!this.ctx) this.init();
      if (!this.ctx) return false;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
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

    // Trigger subtle crystal harp chime on section transitions (exact original pure warm sine D5 harmonic)
    playChime(pitchMultiplier = 1) {
      if (!this.ctx || !this.isPlaying) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      try {
        const now = this.ctx.currentTime;
        const chimeOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(587.33 * pitchMultiplier, now); // D5
        noteGain.gain.setValueAtTime(0.08, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        chimeOsc.connect(noteGain);
        noteGain.connect(this.chimeGain || this.ctx.destination);
        chimeOsc.start(now);
        chimeOsc.stop(now + 2.8);
      } catch (e) {}
    }
  }

  // Create immediate global soundscape instance accessible across all modules
  window.soundscape = new CelestialSoundscape();

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
      size: 2.1,
      map: pTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.34
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
      opacity: 0.12,
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

  // Left Flank Telemetry HUD
  let lastChimedSectionId = 'act-prologue';

  function onActEntered(sectionId, shapeKey) {
    if (sectionId !== lastChimedSectionId) {
      lastChimedSectionId = sectionId;
      if (window.soundscape) {
        const pitchMap = {
          fox: 1.0,     // Act 01 / Act 05
          harp: 1.25,   // Act 02
          fan: 1.14,    // Act 03
          sphere: 1.5   // Act 04
        };
        window.soundscape.playChime(pitchMap[shapeKey] || 1.0);
      }
    }
  }

  function switchConstellation(shapeKey) {
    if (!shapes[shapeKey] || activeShapeKey === shapeKey) return;
    activeShapeKey = shapeKey;
    targetPositions = shapes[shapeKey];
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

      camera.position.z = 150;
      camera.position.x = mouse.x * 12;
      camera.position.y = mouse.y * 8;
      camera.lookAt(0, 0, 0);

      if (pointsMaterial) {
        pointsMaterial.size = 2.1;
        pointsMaterial.opacity = 0.34;
      }
      if (linesMaterial) {
        linesMaterial.opacity = 0.12;
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // =========================================================================
  // SHARED ACT 3 CAROUSEL & THREAD STATE
  // =========================================================================
  let sphereCenterNormalized = { x: 70, y: 500 }; // Extreme left (left: 7%)
  const cardScreenCoords = [
    { x: 500, y: 500 },
    { x: 500, y: 500 },
    { x: 500, y: 500 },
    { x: 500, y: 500 },
    { x: 500, y: 500 }
  ];
  let threadSparks = [];
  const activeThreadIndices = new Set();

  // Traits is a normal scrolling list on every screen, so the pinned carousel stays off.
  const traitsStackedMQ = window.matchMedia('(min-width: 0px)');

  // =========================================================================
  // 3. SCROLLYTELLING CONTROLLER & SECTION INTERSECTION OBSERVER
  // =========================================================================
  function initScrollytelling() {
    const sections = document.querySelectorAll('.story-section');
    const navLinks = document.querySelectorAll('.chapter-link, a.find-her-link');
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

      // Hub & Spoke Clockwise Progressive Scroll Controller for Act 03 Traits
      updateTraitsHubScroll();

      // Check current active section for topbar and rail indicators
      checkActiveSectionOnScroll();
    }

    // Hub & Spoke 3D Angled Carousel: One box in the spotlight at a time,
    // centered in the viewport, all starting from the bottom-right and flying to the top-left.
    let currentOrbitIndex = 0;
    let targetOrbitIndex = 0;
    let sphereOpacity = 0;

    function updateTraitsHubScroll() {
      if (traitsStackedMQ.matches) return;
      const traitsSection = document.getElementById('act-traits');
      if (!traitsSection) return;

      const rect = traitsSection.getBoundingClientRect();
      const totalH = traitsSection.offsetHeight - window.innerHeight;
      if (totalH <= 0) return;

      // Fraction of progress through Act 03 runway: 0 to 1
      const rawProgress = Math.min(1, Math.max(0, -rect.top / totalH));

      // Central sphere fades in as we exit Act 2 (as rect.top enters viewport from bottom: 0.8 to 0.0),
      // remains fully visible for the entirety of Act 3 (0.0 to 0.92),
      // and smoothly fades from view on entering Act 4 (0.92 to 1.0).
      const winH = window.innerHeight;
      const sphereEl = document.querySelector('.traits-sphere-globe');
      const orbitSvg = document.querySelector('.traits-orbit-svg');
      const threadsCanvas = document.getElementById('traits-threads-canvas');

      let targetSphereAlpha = 0;
      if (rect.top > 0) {
        // Exiting Act 2 -> entering Act 3: rect.top goes from winH down to 0
        const enterFraction = Math.max(0, Math.min(1, (winH - rect.top) / (winH * 0.75)));
        targetSphereAlpha = enterFraction;
      } else if (rawProgress <= 0.92) {
        // Entirety of Act 3
        targetSphereAlpha = 1;
      } else {
        // Entering Act 4: smoothly fade out between 0.92 and 1.0
        targetSphereAlpha = Math.max(0, 1 - (rawProgress - 0.92) / 0.08);
      }
      sphereOpacity = targetSphereAlpha;

      if (sphereEl) {
        sphereEl.style.opacity = targetSphereAlpha.toFixed(2);
        sphereEl.style.pointerEvents = targetSphereAlpha > 0.3 ? 'auto' : 'none';
      }
      if (orbitSvg) {
        orbitSvg.style.opacity = (targetSphereAlpha * 0.65).toFixed(2);
      }
      if (threadsCanvas) {
        threadsCanvas.style.opacity = targetSphereAlpha.toFixed(2);
      }

      // Trait 1 trigger appearance set precisely to rawProgress 0.021
      // rawProgress 0.021 -> index 0 (Trait 1) in spotlight
      // rawProgress 1.000 -> index 4 (Trait 5) in spotlight
      const START_THRESHOLD = 0.021;

      let progress = 0;
      if (rawProgress >= START_THRESHOLD) {
        progress = (rawProgress - START_THRESHOLD) / (1 - START_THRESHOLD);
        targetOrbitIndex = progress * 4.0;
      } else {
        targetOrbitIndex = (rawProgress / START_THRESHOLD) * 0.1;
      }

      // If user jumped directly (e.g. hash or instant scroll), snap currentOrbitIndex immediately
      if (Math.abs(targetOrbitIndex - currentOrbitIndex) > 0.6) {
        currentOrbitIndex = targetOrbitIndex;
      }

      renderTraitsOrbit(rawProgress);
    }

    function renderTraitsOrbit(progress) {
      const satellites = document.querySelectorAll('.trait-satellite');
      if (!satellites || satellites.length === 0) return;

      if (traitsStackedMQ.matches) {
        activeThreadIndices.clear();
        satellites.forEach(sat => {
          if (sat.style.transform || sat.style.opacity) {
            sat.removeAttribute('style');
            sat.classList.remove('sat-active');
          }
        });
        return;
      }

      const container = document.querySelector('.traits-hub-container');
      const cw = container ? container.clientWidth : 1000;
      const ch = container ? container.clientHeight : 800;

      // Central wireframe sphere is placed at the extreme left (left: 7%)
      const sphereX = cw * 0.07;
      const sphereY = ch * 0.50;

      sphereCenterNormalized = {
        x: (sphereX / cw) * 1000,
        y: (sphereY / ch) * 1000
      };

      // Trait card carousel is centered in the viewport
      const cx = cw * 0.50;
      const cy = ch * 0.50;

      // Distinct diagonal vector: appear towards bottom-right and fly to top-left across center
      // Vector: delta > 0 is waiting in bottom-right (+X, +Y).
      // delta = 0 sits directly centered in spotlight (xOffset=0, yOffset=0, z-index 35).
      // delta < 0 has passed through to top-left (-X, -Y).
      const dirX = Math.min(360, cw * 0.32);
      const dirY = Math.min(220, ch * 0.24);

      satellites.forEach((sat, idx) => {
        // Offset relative to currently centered item
        const delta = idx - currentOrbitIndex;
        const absDelta = Math.abs(delta);

        let opacity = 0;
        let xOffset = 0;
        let yOffset = 0;

        if (absDelta < 0.95) {
          // Strictly single active item in spotlight:
          // peaks at 1.0 when delta = 0, fades completely to 0 as it leaves (by 0.85 delta)
          opacity = Math.max(0, 1 - Math.pow(absDelta / 0.85, 1.8));

          // 3D position along the angled diagonal trajectory:
          // delta > 0 -> +dirX, +dirY (bottom-right)
          // delta < 0 -> -dirX, -dirY (top-left)
          xOffset = delta * dirX;
          yOffset = delta * dirY;

          sat.style.pointerEvents = absDelta < 0.35 ? 'auto' : 'none';
        } else {
          opacity = 0;
          xOffset = delta > 0 ? dirX * 1.5 : -dirX * 1.5;
          yOffset = delta > 0 ? dirY * 1.5 : -dirY * 1.5;
          sat.style.pointerEvents = 'none';
        }

        // Apply pure 2D translate + opacity relative to the center position (left: 50%, top: 50%)
        // Central sphere is z-index 10, so spotlight card is always in front (z: 35)
        sat.style.left = '50%';
        sat.style.top = '50%';
        sat.style.transform = `translate(calc(-50% + ${Math.round(xOffset)}px), calc(-50% + ${Math.round(yOffset)}px))`;
        sat.style.opacity = opacity.toFixed(2);
        sat.style.zIndex = Math.round(35 - absDelta * 10);

        // Highlight spotlight box
        if (absDelta < 0.35 && opacity > 0.6) {
          if (!sat.classList.contains('sat-active')) {
            satellites.forEach(s => s.classList.remove('sat-active'));
            sat.classList.add('sat-active');
          }
          activeThreadIndices.add(idx);
        } else {
          sat.classList.remove('sat-active');
          if (absDelta >= 0.70) {
            activeThreadIndices.delete(idx);
          }
        }

        // Store 2D screen coordinate in 1000x1000 normalized space for the wavy thread canvas
        cardScreenCoords[idx] = {
          x: ((cx + xOffset) / cw) * 1000,
          y: ((cy + yOffset) / ch) * 1000
        };
      });
    }

    // Animation ticker to smooth 3D motion transitions
    function tickOrbit() {
      if (traitsStackedMQ.matches) return;
      requestAnimationFrame(tickOrbit);
      const diff = targetOrbitIndex - currentOrbitIndex;
      if (Math.abs(diff) > 0.0005) {
        currentOrbitIndex += diff * 0.12;
      }
      const traitsSection = document.getElementById('act-traits');
      if (traitsSection) {
        const rect = traitsSection.getBoundingClientRect();
        const totalH = traitsSection.offsetHeight - window.innerHeight;
        const progress = totalH > 0 ? Math.min(1, Math.max(0, -rect.top / totalH)) : 0;
        renderTraitsOrbit(progress);
      }
    }
    tickOrbit();

    window.addEventListener('scroll', updateScrollMetrics, { passive: true });
    window.addEventListener('resize', updateTraitsHubScroll, { passive: true });

    // Active Section Tracking (Dual: Topbar Links & Right Rail Dots)
    function updateActiveSection(sectionId, shapeKey) {
      if (shapeKey) {
        switchConstellation(shapeKey);
      }
      onActEntered(sectionId, shapeKey);

      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      railDots.forEach(dot => {
        if (dot.getAttribute('data-target') === sectionId) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    // Scroll-based Section Active Tracker (Robust fallback & accurate mapping across large runways)
    function checkActiveSectionOnScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const docH = document.documentElement.scrollHeight - window.innerHeight;

      // If at bottom of page, always highlight last section (Act 05)
      if (docH > 0 && scrollY >= docH - 50) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          const shapeKey = lastSection.getAttribute('data-shape') || 'fox';
          updateActiveSection(lastSection.id, shapeKey);
          return;
        }
      }

      const scrollMiddle = scrollY + window.innerHeight * 0.40;
      let currentSection = sections[0];
      sections.forEach(s => {
        const top = s.offsetTop;
        const bottom = top + s.offsetHeight;
        if (scrollMiddle >= top && scrollMiddle < bottom) {
          currentSection = s;
        }
      });
      if (currentSection) {
        const shapeKey = currentSection.getAttribute('data-shape') || 'fox';
        updateActiveSection(currentSection.id, shapeKey);
      }
    }

    // Nav Helper: Scroll accurately to destination
    const menuBtn = document.querySelector('.nav-menu-btn');
    const siteNav = document.querySelector('.site-nav');

    function setMenuOpen(open) {
      if (!siteNav || !menuBtn) return;
      siteNav.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    }

    if (menuBtn && siteNav) {
      menuBtn.addEventListener('click', () => {
        setMenuOpen(!siteNav.classList.contains('menu-open'));
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
      });
    }

    function scrollToAct(targetId) {
      setMenuOpen(false);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const navHeight = siteNav ? siteNav.offsetHeight : 88;
      const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
      window.scrollTo({
        top: Math.max(0, Math.round(targetTop)),
        behavior: 'instant'
      });
      const shapeKey = targetEl.getAttribute('data-shape') || 'fox';
      updateActiveSection(targetId, shapeKey);
    }

    // Rail Dot Click Handler
    railDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = dot.getAttribute('data-target');
        scrollToAct(targetId);
      });
    });

    // Topbar Nav Links Click Handler
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.slice(1);
          scrollToAct(targetId);
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

        const tiltX = -y * 18;
        const tiltY = x * 18;

        el.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(10px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });

    // 2. 3D Glass Block Parallax Depth Effect
    const splitStages = document.querySelectorAll('[data-split-stage]');
    splitStages.forEach(stage => {
      const wrapper = stage.querySelector('.split-frame-wrapper');
      const deepBg = stage.querySelector('.layer-deep-bg');

      if (!wrapper || !deepBg) return;

      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;

        // Artwork shifts subtly inside the glass block (Parallax Depth: -16px)
        deepBg.style.transform = `scale(1.04) translate3d(${(-nx * 18).toFixed(1)}px, ${(-ny * 14).toFixed(1)}px, 0)`;
      });

      wrapper.addEventListener('mouseleave', () => {
        deepBg.style.transform = 'scale(1.0) translate3d(0, 0, 0)';
      });
    });
  }

  // =========================================================================
  // 5. ANIMATED WAVY THREADS WITH SPARKS & EMBERS FOR ACT 3 HUB & SPOKE
  // =========================================================================
  function initWavyThreads() {
    const canvas = document.getElementById('traits-threads-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    function drawThreads() {
      requestAnimationFrame(drawThreads);
      time += 0.028;

      ctx.clearRect(0, 0, 1000, 1000);

      // Draw threads to visible satellites and emit energetic sparks
      const visibleIndices = Array.from(activeThreadIndices);
      if (visibleIndices.length === 0) return;

      // Connect threads from the sphere's actual right-shifted position
      const cx = sphereCenterNormalized.x;
      const cy = sphereCenterNormalized.y;

      visibleIndices.forEach(idx => {
        const tgt = cardScreenCoords[idx];
        if (!tgt) return;

        // Draw multiple glowing wavy sine-wave filaments
        const dx = tgt.x - cx;
        const dy = tgt.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 20) return; // Only skip if right at center
        const normalX = dist > 0 ? -dy / dist : 0;
        const normalY = dist > 0 ? dx / dist : 1;

        // Core thread + glowing outer halo
        [
          { width: 5.5, alpha: 0.95, col: 'rgba(255, 68, 85, ' },
          { width: 3.2, alpha: 1.0, col: 'rgba(255, 220, 140, ' }
        ].forEach(layer => {
          ctx.beginPath();
          ctx.lineWidth = layer.width;

          const steps = 48;
          for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            const baseX = cx + dx * t;
            const baseY = cy + dy * t;

            // Amplitude bows out in the middle (envelope)
            const envelope = Math.sin(t * Math.PI);
            const wave = Math.sin(t * 12 - time * 3.5 + idx * 1.8) * (20 * envelope)
                       + Math.cos(t * 7 + time * 2.2) * (10 * envelope);

            const px = baseX + normalX * wave;
            const py = baseY + normalY * wave;

            if (step === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }

          const grad = ctx.createLinearGradient(cx, cy, tgt.x, tgt.y);
          grad.addColorStop(0, layer.col + '0.5)');
          grad.addColorStop(0.3, layer.col + (0.95 * layer.alpha) + ')');
          grad.addColorStop(1, layer.col + (1.0 * layer.alpha) + ')');

          ctx.strokeStyle = grad;
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#ff2a44';
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Spawn dynamic sparkling embers along the wavy thread
        for (let k = 0; k < 3; k++) {
          if (Math.random() < 0.75) {
            const t = 0.10 + Math.random() * 0.85;
            const envelope = Math.sin(t * Math.PI);
            const wave = Math.sin(t * 12 - time * 3.5 + idx * 1.8) * (20 * envelope);
            const px = cx + dx * t + normalX * wave;
            const py = cy + dy * t + normalY * wave;

            threadSparks.push({
              x: px,
              y: py,
              vx: (Math.random() - 0.5) * 2.5 + normalX * (Math.random() - 0.5) * 3.5,
              vy: (Math.random() - 0.5) * 2.2 - 1.4, // upward ember drift
              size: 1.6 + Math.random() * 3.0,
              alpha: 1.0,
              decay: 0.016 + Math.random() * 0.018,
              hue: Math.random() > 0.4 ? 'gold' : 'crimson'
            });
          }
        }
      });

      // Update & render sparks
      for (let i = threadSparks.length - 1; i >= 0; i--) {
        const s = threadSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          threadSparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.hue === 'gold' 
          ? `rgba(245, 176, 65, ${s.alpha})` 
          : `rgba(255, 68, 85, ${s.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = s.hue === 'gold' ? '#f5b041' : '#ff2a44';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    drawThreads();
  }

  // =========================================================================
  // 5. TRAIT SATELLITE INTERACTION & HARMONIC SHIFT
  // =========================================================================
  function initTraitSelector() {
    const satellites = document.querySelectorAll('.trait-satellite');

    satellites.forEach((sat, idx) => {
      sat.addEventListener('mouseenter', () => {
        satellites.forEach(s => s.classList.remove('sat-active'));
        sat.classList.add('sat-active');

        activeThreadIndices.add(idx);
      });
    });
  }

  // =========================================================================
  // 6. INNER WIREFRAME SPHERE EMBERS & SPARKS CANVAS
  // =========================================================================
  function initSphereEmbers() {
    const canvas = document.getElementById('sphere-embers-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const cx = W * 0.5, cy = H * 0.5;
    const radius = 95; // Stays bounded inside the sphere globe

    const embers = Array.from({ length: 32 }, () => ({
      x: cx + (Math.random() - 0.5) * radius * 1.4,
      y: cy + (Math.random() - 0.5) * radius * 1.4,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -0.6 - Math.random() * 0.9, // upward ember drift
      size: 1.8 + Math.random() * 3.2,
      alpha: 0.6 + Math.random() * 0.4,
      baseAlpha: 0.8 + Math.random() * 0.2,
      pulseSpeed: 0.04 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.35 ? '#f5b041' : '#ff3344'
    }));

    function drawSphereEmbers() {
      requestAnimationFrame(drawSphereEmbers);
      ctx.clearRect(0, 0, W, H);

      embers.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.pulseSpeed;

        // Circular containment inside sphere: wrap back with fresh coordinates
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d > radius || p.y < cy - radius) {
          p.x = cx + (Math.random() - 0.5) * (radius * 1.2);
          p.y = cy + radius * 0.6 + Math.random() * 15;
          p.vy = -0.4 - Math.random() * 0.6;
        }

        const alpha = Math.max(0, p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase)));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === '#f5b041'
          ? `rgba(245, 176, 65, ${alpha})`
          : `rgba(255, 42, 68, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.hue;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    drawSphereEmbers();
  }

  // =========================================================================
  // 6b. ACT 2 GLASS BLOCK EMBERS & SPARKS CANVAS
  // =========================================================================
  function initGlassBlockEmbers() {
    const canvas = document.getElementById('glass-block-embers');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically match internal resolution to render size for pixel-crisp embers
    function resizeCanvas() {
      if (canvas.offsetWidth && canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // 45 vibrant glowing embers and energetic sparks floating at the forefront of the glass block
    const blockEmbers = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas.width || 440),
      y: Math.random() * (canvas.height || 780),
      vx: (Math.random() - 0.5) * 1.2,
      vy: -0.9 - Math.random() * 1.6, // energetic upward drift
      size: 2.4 + Math.random() * 4.2, // prominent, unmistakable embers
      alpha: 0.7 + Math.random() * 0.3,
      baseAlpha: 0.9 + Math.random() * 0.1,
      pulseSpeed: 0.04 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      sparkType: Math.random() > 0.4 ? 'gold' : 'crimson'
    }));

    function drawBlockEmbers() {
      requestAnimationFrame(drawBlockEmbers);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      blockEmbers.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.pulseSpeed;

        if (p.y < -20) {
          p.y = H + 20;
          p.x = Math.random() * W;
          p.vy = -0.9 - Math.random() * 1.6;
        }
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;

        const currentAlpha = Math.max(0.35, p.baseAlpha * (0.7 + 0.3 * Math.sin(p.phase)));

        // Outer atmospheric glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = p.sparkType === 'gold'
          ? `rgba(245, 176, 65, ${currentAlpha * 0.3})`
          : `rgba(255, 42, 68, ${currentAlpha * 0.3})`;
        ctx.fill();

        // Core saturated ember body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const glowColor = p.sparkType === 'gold' ? '#f5b041' : '#ff2a44';
        ctx.fillStyle = p.sparkType === 'gold'
          ? `rgba(255, 230, 150, ${currentAlpha})`
          : `rgba(255, 80, 100, ${currentAlpha})`;
        ctx.shadowBlur = 16;
        ctx.shadowColor = glowColor;
        ctx.fill();

        // White-hot pinpoint core for maximum brilliance
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ffffff';
        ctx.fill();

        ctx.shadowBlur = 0;
      });
    }

    drawBlockEmbers();
  }

  // =========================================================================
  // 6c. DYNAMIC EXHIBIT NUMBERING
  // =========================================================================
  function initDynamicExhibits() {
    const tiles = Array.from(document.querySelectorAll('.gallery-tile'));
    tiles.forEach((tile, idx) => {
      tile.setAttribute('data-index', idx);
      const numStr = String(idx + 1).padStart(2, '0');
      tile.setAttribute('aria-label', `Open exhibit ${numStr}`);

      // Ensure NO descriptive text or titles exist; only pure dynamic EXHIBIT XX badge
      let infoEl = tile.querySelector('.tile-info');
      if (!infoEl) {
        infoEl = document.createElement('div');
        infoEl.className = 'tile-info';
        tile.appendChild(infoEl);
      }
      infoEl.innerHTML = `<span class="tile-idx">EXHIBIT ${numStr}</span>`;
    });
  }

  // =========================================================================
  // 7. 4K LIGHTBOX & DYNAMIC EXHIBIT NUMBERING
  // =========================================================================
  function initLightbox() {
    initDynamicExhibits();

    const modal = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbIdx = document.getElementById('lightbox-idx');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const backdrop = document.querySelector('.lightbox-backdrop');

    const tiles = Array.from(document.querySelectorAll('.gallery-tile'));

    let currentIndex = 0;

    function openAt(idx) {
      if (idx < 0) idx = tiles.length - 1;
      if (idx >= tiles.length) idx = 0;
      currentIndex = idx;

      const tile = tiles[currentIndex];
      const imgSrc = tile.getAttribute('data-img');
      const numStr = String(currentIndex + 1).padStart(2, '0');
      const idxText = `EXHIBIT ${numStr}`;

      lbImg.src = imgSrc;
      lbIdx.textContent = idxText;

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

    if (closeBtn) {
      closeBtn.setAttribute('aria-label', 'Close exhibit');
      closeBtn.addEventListener('click', close);
    }
    if (backdrop) backdrop.addEventListener('click', close);
    if (prevBtn) {
      prevBtn.setAttribute('aria-label', 'Previous exhibit');
      prevBtn.addEventListener('click', () => openAt(currentIndex - 1));
    }
    if (nextBtn) {
      nextBtn.setAttribute('aria-label', 'Next exhibit');
      nextBtn.addEventListener('click', () => openAt(currentIndex + 1));
    }

    // Touch swipe: left/right to change image, on phones and tablets
    let touchX = null, touchY = null;
    modal.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    modal.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      touchX = touchY = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        openAt(currentIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

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
  function syncAudioControl(pill, label, isPlaying) {
    pill.classList.toggle('playing', isPlaying);
    pill.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    pill.setAttribute('aria-label', isPlaying ? 'Turn sound off' : 'Turn sound on');
    if (label) label.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
  }

  function initSoundAnnouncement(pill) {
    const note = document.getElementById('sound-announcement');
    if (!note) return;

    note.setAttribute('aria-hidden', 'true');

    const reveal = () => {
      note.textContent = 'Sound is available';
      note.setAttribute('aria-hidden', 'false');
      note.classList.add('is-visible');
    };
    const conceal = () => {
      note.classList.remove('is-visible');
      window.setTimeout(() => note.setAttribute('aria-hidden', 'true'), 800);
    };

    const showTimer = window.setTimeout(reveal, 700);
    const hideTimer = window.setTimeout(conceal, 8700);

    pill?.addEventListener('click', () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      conceal();
    }, { once: true });
  }

  function initAudioPill() {
    const pill = document.getElementById('audio-pill');
    const label = pill?.querySelector('.audio-label');

    if (pill && label && window.soundscape) {
      // Leave the audio graph unstarted so nothing plays until the visitor opts in.
      syncAudioControl(pill, label, window.soundscape.isPlaying);

      pill.addEventListener('click', () => {
        const isPlaying = window.soundscape.toggle();
        syncAudioControl(pill, label, isPlaying);
      });
    }

  }

  function initAgeGate() {
    const gate = document.getElementById('age-gate');
    const enterBtn = document.getElementById('age-enter');
    const leaveBtn = document.getElementById('age-leave');
    const hidden = document.querySelectorAll('[data-age-hide]');
    const pill = document.getElementById('audio-pill');
    if (!gate || !enterBtn || !leaveBtn) return;

    const releasePage = () => {
      document.documentElement.classList.remove('age-locked');
      hidden.forEach((el) => {
        el.inert = false;
        if (el.getAttribute('aria-hidden') === 'true' && !el.classList.contains('telemetry-hud')) {
          el.removeAttribute('aria-hidden');
        }
      });
    };

    const lockPage = () => {
      document.documentElement.classList.add('age-locked');
      hidden.forEach((el) => {
        el.inert = true;
        el.setAttribute('aria-hidden', 'true');
      });
    };

    if (document.documentElement.classList.contains('age-ok')) {
      gate.hidden = true;
      releasePage();
      initSoundAnnouncement(pill);
      return;
    }

    lockPage();
    enterBtn.focus();

    const buttons = [enterBtn, leaveBtn];
    gate.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const active = document.activeElement;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });

    enterBtn.addEventListener('click', () => {
      try { localStorage.setItem('kosmos-age-ok', '1'); } catch (e) {}
      document.documentElement.classList.add('age-ok');
      gate.hidden = true;
      releasePage();
      initSoundAnnouncement(pill);
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
      }
    });

    leaveBtn.addEventListener('click', () => {
      window.location.replace('https://www.google.com/');
    });
  }

  // =========================================================================
  // INITIALIZATION ON DOM READY
  // =========================================================================
  function runInit() {
    initThree();
    animate();
    initScrollytelling();
    init3DTiltAndSplitDepth();
    initWavyThreads();
    initSphereEmbers();
    initGlassBlockEmbers();
    initDynamicExhibits();
    initTraitSelector();
    initLightbox();
    initAudioPill();
    initAgeGate();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', runInit);
  } else {
    runInit();
  }

})();
