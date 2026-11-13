// Source of three.bundle.min.js: three.js r187 cut down to the classes assets/main.js uses,
// exposed as the global THREE it expects. How to rebuild: assets/vendor/README.md.
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, FogExp2, LineBasicMaterial,
  LineSegments, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer,
} from './three.module.js';

window.THREE = {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, FogExp2, LineBasicMaterial,
  LineSegments, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer,
};
