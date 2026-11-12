// Loads assets/main.js or the 404 inline script in a vm with a permissive DOM stub.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// Any property read returns another stub, any call or `new` returns a stub, and
// assigned values read back. Enough for page code that only pokes the DOM.
export function stub(init = {}) {
  const store = { ...init };
  return new Proxy(function () {}, {
    get(_, k) {
      if (k in store) return store[k];
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === "then") return undefined;
      return (store[k] = stub());
    },
    set(_, k, v) { store[k] = v; return true; },
    has: () => true,
    apply: () => stub(),
    construct: () => stub(),
  });
}

function env({ reduce = false, byId = {}, bySelector = {}, storage = {}, extra = {} }) {
  const raf = [], timers = [], listeners = {};
  const document = stub({
    readyState: "complete",
    getElementById: (id) => byId[id] ?? stub(),
    querySelector: (s) => bySelector[s] ?? stub(),
    querySelectorAll: (s) => bySelector[s] ?? [],
  });
  const ctx = {
    document, console, performance, Math, Number, String, Array, Object, Set, Float32Array, Promise, Error, Event: function () {},
    navigator: stub(), location: { hash: "", replace() {} },
    innerWidth: 1000, innerHeight: 800, devicePixelRatio: 1, pageYOffset: 0,
    matchMedia: (q) => ({
      matches: q.includes("prefers-reduced-motion") ? reduce : +(/min-width:\s*(\d+)px/.exec(q) || [0, 1e9])[1] <= 1000,
      addEventListener() {},
    }),
    requestAnimationFrame: (fn) => raf.push(fn),
    setTimeout: (fn) => timers.push(fn), clearTimeout() {}, setInterval() {}, clearInterval() {},
    addEventListener: (ev, fn) => (listeners[ev] ??= []).push(fn), removeEventListener() {},
    dispatchEvent() {}, scrollTo() {},
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => (storage[k] = String(v)) },
    ...extra,
  };
  ctx.window = ctx;
  return { ctx, raf, timers, listeners, storage };
}

export function loadMain(opts = {}) {
  const e = env(opts);
  e.errors = [];
  e.ctx.console = { ...console, error: (...a) => e.errors.push(a.join(" ")) };
  e.ctx.module = { exports: {} };
  vm.runInNewContext(read("assets/main.js"), e.ctx);
  return { ...e, exports: e.ctx.module.exports };
}

export function load404(opts = {}) {
  const e = env(opts);
  vm.runInNewContext(read("404.html").match(/<script>([\s\S]*?)<\/script>/)[1], e.ctx);
  return e;
}
