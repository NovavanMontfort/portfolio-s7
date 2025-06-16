import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';

const container = document.getElementById('skull-container');

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  2000
);
camera.position.set(0, 0, 100);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
scene.background = null;
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
renderer.domElement.style.pointerEvents = 'auto';

// LIGHTING
scene.add(new THREE.AmbientLight(0x404040, 1.5));

const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
fillLight.position.set(0, 5, 10);
scene.add(fillLight);

const spotLight = new THREE.SpotLight(0xffffff, 6);
spotLight.position.set(10, 20, 10);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2;
spotLight.decay = 2;
spotLight.distance = 100;
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);

const rimLight = new THREE.DirectionalLight(0xffffff, 1);
rimLight.position.set(-10, 10, -10);
scene.add(rimLight);

// LOAD SKULL
const loader = new GLTFLoader();
let skull;
let mixer;
let action;

loader.load('/public/skull.glb', (gltf) => {
  skull = gltf.scene;

  // Bereken bounding box
  const box = new THREE.Box3().setFromObject(skull);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Center het model
  skull.position.x += (skull.position.x - center.x);
  skull.position.y += (skull.position.y - center.y);
  skull.position.z += (skull.position.z - center.z);

  // Grotere schaal en dichterbij camera
  const desiredSize = 25;
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = desiredSize / maxDim;
  skull.scale.setScalar(scale);

  // Dichterbij zetten voor grotere weergave
  camera.position.z = maxDim * 1.2;

  skull.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(skull);

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new AnimationMixer(skull);
    action = mixer.clipAction(gltf.animations[0]);
    action.paused = true;
    action.enabled = true;
    action.play();
  }
});

// Hover animatie
renderer.domElement.addEventListener('mouseenter', () => {
  if (action) action.paused = false;
});
renderer.domElement.addEventListener('mouseleave', () => {
  if (action) action.paused = true;
});

// Scroll doorlaten
renderer.domElement.addEventListener(
  'wheel',
  (e) => {
    e.stopPropagation();
  },
  { passive: true }
);

// MOUSE HOVER EFFECT
let targetRotationY = 0;
let targetRotationX = 0;

container.addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) / rect.width;
  const mouseY = (e.clientY - rect.top) / rect.height;

  targetRotationY = (mouseX - 0.5) * 0.6;
  targetRotationX = (mouseY - 0.5) * 0.6;
});

// ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  camera.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.05;

  if (mixer && skull) {
    mixer.update(clock.getDelta());

    skull.rotation.y += (targetRotationY - skull.rotation.y) * 0.1;
    skull.rotation.x += (targetRotationX - skull.rotation.x) * 0.1;
  }

  renderer.render(scene, camera);
}
animate();

// RESPONSIVE!
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

















  




