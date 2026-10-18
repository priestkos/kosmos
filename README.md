# K'os Mos — Interactive 3D Scrollytelling Site

An award-winning, interactive website designed for **K'os Mos** (Courtesan of Balmung & Tonberry, Wandering Bard & Mercenary for hire).

## Features & Highlights

1. **WebGL 3D Parametric Constellation (Three.js)**
   - Morphing 3D starfield & filament system with 2,200 dynamic particles.
   - Transitions between 5 lore-accurate formations keyed to scroll progression:
     1. **Kitsune Sigil** (Ears, V-jawline, whiskers, forehead diamond)
     2. **Celestial Harp** (Curved bow frame with resonant harmonic strings)
     3. **Nine Tails Fan** (Nine distinct sweeping ethereal tails)
     4. **Starlight Prism** (Sacred geometric hexagonal prism)
     5. **Astral Vortex** (Dense cosmic spherical particle nebula)
   - Pointer damping parallax and depth tracking (`camera.position.z`).

2. **Award-Winning Split-Depth 3D Illusion**
   - Multi-plane perspective parallax with white vertical depth guide bars.
   - Foreground character layers dynamically break in front of the spatial guide bars on mouse movement.
   - Deep background recession planes with atmospheric foxfire smoke overlays.

3. **Scrollytelling Architecture**
   - Smooth Chapter navigation (`01 PROLOGUE` through `06 DEN`).
   - Sticky left column with interactive trait harmonizer and live blockquotes.
   - Right-edge vertical quick rail and live scroll percentage progress line.

4. **12-Image Visual Archive & 4K Lightbox**
   - Comprehensive gallery showcasing all 12 canonical character portraits (`1.jpg` through `12.jpg`).
   - 3D hover elevation, warm amber glow, and interactive modal viewer with keyboard navigation (`Esc`, `←`, `→`).

5. **Aetheric Synthesizer Soundscape (Web Audio API)**
   - Procedural D-minor harmonic drone with multi-oscillator LFO modulation and resonant low-pass warmth.
   - Celestial crystal chimes triggered on section transitions and interactive clicks.
   - Interactive pill toggle with live audio wave animation.

6. **Completely Local & Offline**
   - Bundled local Three.js (`assets/vendor/three.min.js`).
   - Bundled local high-res imagery (`assets/images/1.jpg` - `12.jpg`).
   - Zero external runtime script dependencies.

## Verification
- Headless Edge rendering verified across all 6 story chapters.
- Visual inspection confirmed split-depth guide bars, typography hierarchy, particle rendering, and responsive grid layouts.
