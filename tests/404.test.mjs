// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { load404 } from "./harness.mjs";

test("404 animates its frame loop normally", () => {
  const p = load404();
  assert.equal(p.raf.length, 1);
  p.raf.shift()(16);
  assert.equal(p.raf.length, 1, "frame re-requests itself");
});

test("404 draws one static frame under reduced motion", () => {
  const p = load404({ reduce: true });
  p.raf.splice(0).forEach((f) => f(16));  // the startup frames (resize, theme, counts, initial)
  assert.equal(p.raf.length, 0, "no loop");
});
