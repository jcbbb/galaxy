import {
  Scene,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  AdditiveBlending,
  Color,
  SphereBufferGeometry,
  TextureLoader,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { MeshStandardMaterial } from "three";
import { AmbientLight } from "three";
import { DirectionalLight } from "three";

const debug = new dat.GUI({
  width: 400,
});

/**
 ** Textures
 */
const textureLoader = new TextureLoader();
const rockColorTexture = textureLoader.load("/public/assets/textures/rock-color.jpg");
const rockDispTexture = textureLoader.load("/public/assets/textures/rock-disp.png");
const rockNormalTexture = textureLoader.load("/public/assets/textures/rock-normal.jpg");
const rockOccTexture = textureLoader.load("/public/assets/textures/rock-occ.jpg");
const rockRoughTexture = textureLoader.load("/public/assets/textures/rock-rough.jpg");
/**
 ** Scene
 */
const scene = new Scene();

/**
 ** Objects
 */

const params = {
  count: 100000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff3000",
  outsideColor: "#0b3cba",
};

debug
  .add(params, "count")
  .min(100)
  .max(1000000)
  .step(100)
  .name("particle-count")
  .onFinishChange(generateGalaxy);
debug
  .add(params, "size")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .name("particle-size")
  .onFinishChange(generateGalaxy);
debug
  .add(params, "radius")
  .min(0.01)
  .max(20)
  .step(0.01)
  .name("galaxy-radius")
  .onFinishChange(generateGalaxy);

debug
  .add(params, "branches")
  .min(2)
  .max(20)
  .step(1)
  .name("galaxy-branches")
  .onFinishChange(generateGalaxy);

debug
  .add(params, "spin")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("galaxy-spin")
  .onFinishChange(generateGalaxy);

debug
  .add(params, "randomness")
  .min(0)
  .max(2)
  .step(0.001)
  .name("galaxy-randomness")
  .onFinishChange(generateGalaxy);

debug
  .add(params, "randomness")
  .min(1)
  .max(10)
  .step(0.001)
  .name("galaxy-randomnessPower")
  .onFinishChange(generateGalaxy);

debug.addColor(params, "insideColor").onFinishChange(generateGalaxy);
debug.addColor(params, "outsideColor").onFinishChange(generateGalaxy);

let particlesGeometry;
let particlesMaterial;
let particles;
let earthGeometry;
let earthMaterial;
let earth;

function generateGalaxy() {
  if (particles) {
    particlesGeometry.dispose();
    particlesMaterial.dispose();

    earthGeometry.dispose();
    earthMaterial.dispose();

    scene.remove(earth);
    scene.remove(particles);
  }

  const ambientLight = new AmbientLight(0xffffff, 0.5);
  const directionalLight = new DirectionalLight(params.insideColor, 1);
  directionalLight.position.set(params.radius * 2, params.radius);
  scene.add(ambientLight, directionalLight);

  earthGeometry = new SphereBufferGeometry(1, 32, 32);
  earthMaterial = new MeshStandardMaterial({
    map: rockColorTexture,
    normalMap: rockNormalTexture,
    aoMap: rockOccTexture,
    aoMapIntensity: 0.1,
    roughnessMap: rockRoughTexture,
  });

  earth = new Mesh(earthGeometry, earthMaterial);
  earth.scale.set(0.3, 0.3, 0.3);
  earth.position.set(params.radius / 2, 0, 0);
  scene.add(earth);

  particlesGeometry = new BufferGeometry();
  const positions = new Float32Array(params.count * 3);
  const colors = new Float32Array(params.count * 3);
  const colorInside = new Color(params.insideColor);
  const colorOutside = new Color(params.outsideColor);

  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;

    // position
    const radius = Math.random() * params.radius;
    const spinAngle = radius * params.spin;
    const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    // colors
    const mixedColor = colorInside.clone().lerp(colorOutside, radius / params.radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  particlesGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  particlesGeometry.setAttribute("color", new BufferAttribute(colors, 3));

  particlesMaterial = new PointsMaterial({
    size: params.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
  });

  particles = new Points(particlesGeometry, particlesMaterial);

  scene.add(particles);
}

generateGalaxy();

/**
 ** Cameras
 */
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

/**
 ** Renderer
 */
const canvas = document.getElementById("webgl");
const renderer = new WebGLRenderer({
  canvas,
});

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  particles.rotation.y = elapsedTime * 0.1;

  controls.update();
  renderer.render(scene, camera);

  window.requestAnimationFrame(animate);
}

animate();
