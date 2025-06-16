import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const container = document.getElementById('three-container');
container.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.set(15, 30, 30);

//LICHT
const light = new THREE.AmbientLight(0xffffff, 2);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 2);
spotLight.position.set(10, 20, 10);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2; // zachtheid van rand
spotLight.castShadow = true;
scene.add(spotLight);

//basislicht
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

//zonlicht + schaduw
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 10, 10);
dirLight.castShadow = true;
scene.add(dirLight);

//voor wat extra van onder
const fillLight = new THREE.PointLight(0xffccaa, 0.8);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);


let modelCenter = new THREE.Vector3(0, 0, 0);

const loader = new GLTFLoader();
loader.load('/pc.glb', (gltf) => {
  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
    }
  });

  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  modelCenter = box.getCenter(new THREE.Vector3());
  model.position.sub(modelCenter);

  camera.lookAt(model.position);
});

let scrollProgress = 0;

const startPos = { x: 15, y: 30, z: 30 };
const midPos = { x: 0.1, y: 1, z: 10 };
const endPos = { x: 0.1, y: 0.3, z: 0.001 };

let transitioned = false;
let scrollBlocked = false;

function blockNativeScroll() {
  if (!scrollBlocked) {
    window.addEventListener('scroll', preventScroll, { passive: false });
    scrollBlocked = true;
  }
}

function allowNativeScroll() {
  if (scrollBlocked) {
    window.removeEventListener('scroll', preventScroll, { passive: false });
    scrollBlocked = false;
  }
}

function preventScroll(e) {
  e.preventDefault();
  window.scrollTo(0, 0);
}

blockNativeScroll();

window.addEventListener('wheel', (event) => {
  if (!transitioned) {
    event.preventDefault();

    scrollProgress += event.deltaY * 0.001;
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

    let x, y, z;

    if (scrollProgress < 0.7) {
      const t = scrollProgress / 0.7;
      x = startPos.x + (midPos.x - startPos.x) * t;
      y = startPos.y + (midPos.y - startPos.y) * t;
      z = startPos.z + (midPos.z - startPos.z) * t;
    } else {
      const t = (scrollProgress - 0.7) / 0.3;
      x = midPos.x + (endPos.x - midPos.x) * t;
      y = midPos.y + (endPos.y - midPos.y) * t;
      z = midPos.z + (endPos.z - midPos.z) * t;
    }

    gsap.to(camera.position, {
      x,
      y,
      z,
      duration: 0.3,
      ease: 'power1.out',
      onUpdate: () => {
        const target = modelCenter.clone();
        target.y -= 1.5; //omlaag omhoog
        target.x -= -0.3; //links rechts
        camera.lookAt(target);
      },
      overwrite: 'auto'
    });

    if (scrollProgress >= 1 && !transitioned) {
      transitioned = true;

      const websiteContent = document.getElementById('website-content');
      websiteContent.style.pointerEvents = 'none';
      websiteContent.style.opacity = 0;
      websiteContent.style.display = 'block';

      gsap.to(container, {
        opacity: 0,
        duration: 0.2, //transition time
        onComplete: () => {
          //na fade-out verberg 3D container
          container.style.display = 'none';

          //ativeer fade-in van de website content
          gsap.to(websiteContent, {
            opacity: 1,
            duration: 1,
            onComplete: () => {
              websiteContent.style.pointerEvents = 'auto';
              window.scrollTo(0, 0);
              allowNativeScroll();
            }
          });
        }
      });
    }
  }
}, { passive: false });

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});











