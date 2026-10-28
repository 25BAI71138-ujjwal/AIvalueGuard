# Standalone Three.js Build Files

Official distribution from [mrdoob/three.js](https://github.com/mrdoob/three.js).

## Available Files:
- `three.module.js`: Complete ES module build of Three.js engine.
- `three.core.js`: Core Three.js runtime.
- `GLTFLoader.js`: Loader for 3D glTF / GLB assets.
- `DRACOLoader.js`: Decoder for Draco-compressed 3D meshes.
- `OrbitControls.js`: Interactive camera controls for 3D canvas viewport.

## How to Use in HTML / Vanilla JS:
```html
<script type="module">
  import * as THREE from '/libs/three/three.module.js';
  import { GLTFLoader } from '/libs/three/GLTFLoader.js';
  import { OrbitControls } from '/libs/three/OrbitControls.js';

  const scene = new THREE.Scene();
  // ...
</script>
```

## How to Use in Vite / React:
```typescript
import * as THREE from '../assets/three/three.module.js';
import { GLTFLoader } from '../assets/three/GLTFLoader.js';
```
