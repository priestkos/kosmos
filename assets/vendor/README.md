# Vendored three.js

`three.bundle.min.js` is three.js **r187** (npm `three@0.187.0`, MIT) cut down to the 13 classes
`assets/main.js` uses, as one classic script that sets the global `THREE`. It replaces the
deprecated r160 UMD build (`three.min.js`), which logged a deprecation warning on every load
and no longer exists upstream. 543 KB, 134 KB gzipped (the old file: 670 KB, 167 KB).

Rebuild (Bun's built-in bundler, nothing installed):

1. Download `https://registry.npmjs.org/three/-/three-0.187.0.tgz` and check it against the
   registry's integrity value
   `sha512-Qiu7R+Cmh8CstZsY1uJOSWnVlfo7ZtNLV7mF8Jltk3LB3AtDu9cRZlcnRKkAk8Y4z6KKw35z7Y7Urd7jWY8etA==`.
2. Put its `build/three.module.js` and `build/three.core.js` next to a copy of
   `three-bundle.entry.js` in an empty folder, and from that folder run:

```
bun build ./three-bundle.entry.js --minify --format=iife --target=browser --outfile=./three.bundle.min.js --banner="/*! @license three.js r187 | Copyright 2010-2026 three.js authors | SPDX-License-Identifier: MIT | only the classes assets/main.js uses, see assets/vendor/README.md */"
```

With Bun 1.4.4 the output is byte-identical (sha256 `53c20546b4c5267ad451…`). If `main.js`
starts using another `THREE.*` class, add it to both lists in `three-bundle.entry.js` and rebuild.
