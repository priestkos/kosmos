/* ==========================================================================
   K'os Mos — shared site scripts
   Both blocks self-guard, so one file safely serves every page.
   ========================================================================== */

/* ---------- Flaming sparks background ---------- */
(() => {
  const canvas = document.getElementById('sparks-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, sparks;

  const COUNT = window.innerWidth < 700 ? 22 : 40;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function makeSpark() {
    return {
      x: Math.random() * W,
      y: H + Math.random() * H * 0.3,
      r: 0.6 + Math.random() * 1.6,
      vy: -(0.15 + Math.random() * 0.45),          // slow rise
      vx: (Math.random() - 0.5) * 0.18,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.004 + Math.random() * 0.01,
      life: 0,
      maxLife: 400 + Math.random() * 500,
      hue: 18 + Math.random() * 24                  // orange -> amber
    };
  }

  sparks = Array.from({ length: COUNT }, () => {
    const s = makeSpark();
    s.y = Math.random() * H;                        // scatter at start
    s.life = Math.random() * s.maxLife;
    return s;
  });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const s of sparks) {
      s.life++;
      s.drift += s.driftSpeed;
      s.x += s.vx + Math.sin(s.drift) * 0.15;
      s.y += s.vy;

      if (s.y < -10 || s.life > s.maxLife) Object.assign(s, makeSpark(), { y: H + 5, life: 0 });

      const t = s.life / s.maxLife;
      const alpha = 0.35 * Math.sin(Math.PI * t);   // fade in/out
      if (alpha <= 0.01) continue;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 90%, 60%, ${alpha})`;
      ctx.shadowColor = `hsla(${s.hue}, 95%, 55%, ${alpha})`;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  tick(); // draw one static frame even if reduced motion is on
})();

/* ---------- Lightbox ---------- */
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const shots = Array.from(document.querySelectorAll('.shot'));
  if (!shots.length) return;

  const img = document.getElementById('lb-img');
  const count = document.getElementById('lb-count');
  let idx = 0;

  function show(i) {
    idx = (i + shots.length) % shots.length;
    img.src = shots[idx].querySelector('img').src;
    count.textContent = (idx + 1) + ' / ' + shots.length;
    lb.classList.add('open');
    document.body.classList.add('lb-open');
  }
  function close() {
    lb.classList.remove('open');
    document.body.classList.remove('lb-open');
    img.src = '';
  }

  shots.forEach((shot, i) => {
    shot.addEventListener('click', e => { e.preventDefault(); show(i); });
  });

  document.getElementById('lb-prev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  document.getElementById('lb-next').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  document.getElementById('lb-close').addEventListener('click', e => { e.stopPropagation(); close(); });
  lb.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });

  // Download friction: block right-click & drag on images.
  // Deterrent only — determined users can still save via dev tools.
  document.addEventListener('contextmenu', e => {
    if (e.target.closest('.shot') || e.target === img) e.preventDefault();
  });
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
})();
