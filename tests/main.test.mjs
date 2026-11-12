// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { loadMain, stub } from "./harness.mjs";

const page = loadMain();
const m = page.exports;

test("page init runs in the stub without errors", () => {
  assert.deepEqual(page.errors, []);
});

test("noteNameToFreq: A4 is 440 Hz, quantised to the 20 s loop", () => {
  assert.equal(m.noteNameToFreq("A4"), 440);
  assert.equal(m.noteNameToFreq("A5"), 880);
  assert.equal(m.noteNameToFreq("D4"), Math.round(293.6648 * 20) / 20);
});

test("noteNameForStep covers all 32 steps and stays in the pattern", () => {
  for (let s = 0; s < 32; s++) assert.match(m.noteNameForStep(s), /^[A-G]#?[3-5]$/, String(s));
  assert.equal(m.noteNameForStep(0), "D4");
  assert.equal(m.noteNameForStep(31), "A4");
});

test("safeGalleryAssetUrl accepts only gallery image paths", () => {
  const img = m.GALLERY_IMAGE_PATH, thumb = m.GALLERY_THUMB_PATH;
  assert.equal(m.safeGalleryAssetUrl("assets/images/3.jpg", img), "assets/images/3.jpg");
  assert.equal(m.safeGalleryAssetUrl("assets/images/thumbs/3.webp", thumb), "assets/images/thumbs/3.webp");
  for (const bad of ["../assets/images/3.jpg", "assets/images/../3.jpg", "javascript:alert(1)",
    "data:image/png;base64,x", "assets/images/3 .jpg", "assets/images/3.jpg\"", "assets/images/x.jpg", "", null, 7,
    "assets/images/" + "1".repeat(200) + ".jpg"]) {
    assert.equal(m.safeGalleryAssetUrl(bad, img), null, String(bad));
  }
  assert.equal(m.safeGalleryAssetUrl("assets/images/3.jpg", thumb), null);
});

test("only visible canvases run frame loops (no hidden trait-thread canvas)", () => {
  assert.deepEqual(page.raf.map((f) => f.name).sort(), ["animate", "drawBlockEmbers", "drawSphereEmbers"]);
});

test("reduced motion: no frame loops, tilt or parallax listeners", () => {
  const tilt = [];
  const el = { addEventListener: (ev) => tilt.push(ev), querySelector: () => null };
  const p = loadMain({ reduce: true, bySelector: { "[data-tilt]": [el] } });
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.raf.map((f) => f.name), []);
  assert.deepEqual(tilt, []);
  const normal = [];
  loadMain({ bySelector: { "[data-tilt]": [{ ...el, addEventListener: (ev) => normal.push(ev) }] } });
  assert.deepEqual(normal, ["mousemove", "mouseleave"]);
});

test("lightbox clears the previous image when a tile's data-img is rejected", () => {
  const tile = (img) => {
    const on = {};
    return { on, getAttribute: (n) => (n === "data-img" ? img : null), setAttribute() {}, querySelector: () => null,
      appendChild() {}, addEventListener: (ev, fn) => (on[ev] = fn) };
  };
  const tiles = [tile("assets/images/1.jpg"), tile("../../evil.jpg")];
  const lbImg = { removeAttribute(n) { delete this[n]; } };
  const p = loadMain({ bySelector: { ".gallery-tile": tiles }, byId: { "lightbox-img": lbImg } });
  assert.deepEqual(p.errors, []);
  tiles[0].on.click();
  assert.equal(lbImg.src, "assets/images/1.jpg");
  tiles[1].on.click();
  assert.equal(lbImg.src, undefined, "still showing the previous exhibit");
});

test("sound toggle ramps from the current gain, not the last scheduled event", () => {
  const calls = [];
  const param = () => ({ value: 0.07, setValueAtTime: (...a) => calls.push(["set", ...a]),
    cancelScheduledValues: (...a) => calls.push(["cancel", ...a]),
    linearRampToValueAtTime: (...a) => calls.push(["ramp", ...a]), setTargetAtTime() {}, exponentialRampToValueAtTime() {} });
  let master = null;
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.state = "running"; this.destination = stub(); }
    createGain() { const g = { gain: master ? stub() : param(), connect() {} }; master ??= g; return g; }
    createOscillator() { return stub(); } createBiquadFilter() { return stub(); }
    createDelay() { return stub(); } createChannelMerger() { return stub(); }
  }
  const p = loadMain({ extra: { AudioContext: FakeAudioContext } });
  const sound = p.ctx.soundscape;
  sound.toggle();                 // on at t=0: ramp up over 2.5 s
  sound.ctx.currentTime = 0.5;
  calls.length = 0;
  sound.toggle();                 // off mid-ramp
  assert.deepEqual(calls, [["cancel", 0.5], ["set", 0.07, 0.5], ["ramp", 0, 1.7]]);
});
