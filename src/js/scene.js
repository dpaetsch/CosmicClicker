import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create and export the scene object
export const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1e12);


// Renderer setup
const canvas = document.querySelector("canvas.threejs");
//const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });

renderer.setSize(window.innerWidth, window.innerHeight);

// Controls setup
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = false;

// Resize event handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Export for use in other files
export { camera, renderer, controls };


export const setCameraPosition = (positionX,positionY,positionZ) => {
  camera.position.set(positionX, positionY, positionZ);
}
