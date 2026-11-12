// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { loadMain } from "./harness.mjs";

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
