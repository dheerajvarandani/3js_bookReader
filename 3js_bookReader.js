// -----------------------------------------------------------------------------
// 3‑D BOOK – TEXTURE CACHE + CAMERA TRANSITIONS + START BUTTON + HDRI
// (clampWhenFinished fixed: property assignment instead of function call)
// -----------------------------------------------------------------------------
//  Single‑file drop‑in.  All animation actions now use:
//      action.clampWhenFinished = true;
//  instead of the erroneous .clampWhenFinished(true).
// -----------------------------------------------------------------------------

import * as THREE from 'three';
import { GLTFLoader }          from './three/GLTFLoader.js';
import { OrbitControls }       from './three/OrbitControls.js';
import { RGBELoader }          from './three/RGBELoader.js';
import { RectAreaLightHelper } from './three/RectAreaLightHelper.js';
import { Tween, Easing }       from './tween/tween.esm.js';

// ‑‑‑‑‑‑‑‑‑‑ GLOBAL CONSTANTS --------------------------------------------------
const NUM_PAGES   = 148;
const NUM_SHEETS  = NUM_PAGES / 2;     // 74
const cameraTransitionTime = 2000;     // ms

// Cache for ALL page textures
const textureCache = Object.create(null);
const fallbackTex  = new THREE.Texture(document.createElement('canvas'));
fallbackTex.needsUpdate = true;

// -----------------------------------------------------------------------------
//  LOADING SCREEN + CANVAS SETUP
// -----------------------------------------------------------------------------
const loadingDiv = document.getElementById('loadingDiv');
const container  = document.getElementById('threejscanvas');

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.02;
controls.rotateSpeed   = 0.1;
controls.maxAzimuthAngle = 1;
controls.maxPolarAngle = 1;
controls.minAzimuthAngle = -1;
controls.minPolarAngle = 0;
controls.maxDistance = 5.5;


camera.position.set(-1, 2.25, 6);
controls.target.set(-1, 1, 1);

// Lights ----------------------------------------------------------------------
const spot = new THREE.SpotLight('#FFFFFF', 1, 5, 0.5, 1);
spot.position.set(-5, 4, -3);
//scene.add(spot);

// ───────────────── Candle‑style point light (flickering) ─────────────────────
const candleLight = new THREE.PointLight('#ffb36b', 1.2, 20, 0.5); // warm yellow‑orange
candleLight.position.set(-4.2, 1.8, -1.2);   // initial guess – move as needed
scene.add(candleLight);



// visual aid: tiny glowing bulb + helper wireframe

const candleHelper = new THREE.PointLightHelper(candleLight, 0.15);
//scene.add(candleHelper);

const rectBack = new THREE.RectAreaLight('#f0a344', 1, 40, 20);
rectBack.position.set(-0.4, 5, 12);
rectBack.lookAt(0, 5, 0);
scene.add(rectBack);

// Background sphere -----------------------------------------------------------
const backgroundSphere = new THREE.Mesh(
  new THREE.SphereGeometry(40, 20, 20),
  new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('./assets/riyadh360_3.jpg'),
    side: THREE.DoubleSide,
  })
);
backgroundSphere.position.set(0, -175, 0);
backgroundSphere.rotation.set(0, -4.8, 0);
backgroundSphere.scale.set(20, 20, 20);
scene.add(backgroundSphere);

// -------------------------------- TEXTURE PRELOAD ----------------------------
function pad(n) { return String(n).padStart(3, '0'); }

function preloadTextures() {
    return new Promise(resolve => {
      const manager = new THREE.LoadingManager(resolve);
      const loader  = new THREE.TextureLoader(manager);
  
      for (let i = 1; i <= NUM_PAGES; i++) {
        loader.load(`./assets/pages_webp/pg_${pad(i)}.webp`, tex => {
  
          /* 🔹 Configure once, right after load */
          tex.flipY           = false;
          tex.colorSpace      = THREE.SRGBColorSpace;          // correct gamma
          tex.generateMipmaps = true;                          // enable tri‑linear
          tex.minFilter       = THREE.LinearMipmapLinearFilter;// smooth when zoomed out
          tex.magFilter       = THREE.LinearFilter;            // crisp when zoomed in
          tex.anisotropy      = 16
          /* 🔹 End config */
  
          textureCache[i] = tex;                    // store in cache
        });
      }
    });
  }

// ------------------------------- MODEL + MATERIALS ---------------------------
let mixer, bookAnim, root;
let page0Mat, page1Mat, page2Mat, page3Mat;
let flame;
let currentSheet = 1;

function applyTexturesForSheet(sheet) {
  const firstPage = (sheet - 1) * 2 + 1;
  const maps = [
    textureCache[firstPage - 1] || fallbackTex,
    textureCache[firstPage]     || fallbackTex,
    textureCache[firstPage + 1] || fallbackTex,
    textureCache[firstPage + 2] || fallbackTex,
  ];
  [page0Mat, page1Mat, page2Mat, page3Mat].forEach((m, i) => {
    m.map = maps[i];
    m.map.needsUpdate = true;
  });
}

function buildBook(gltf) {
  root = gltf.scene;
  bookAnim   = gltf.animations;

      var pages = [root.getObjectByName("page_0"),
      root.getObjectByName("page_1").children[2],
      root.getObjectByName("page_1").children[1],
      root.getObjectByName("page_2")
      ]
      
      
      root.getObjectByName("pSphere1").material.color = new THREE.Color(0x000000);
      root.getObjectByName("pSphere1").material.emissiveIntensity = 0
  
      pages.forEach(page => {
          const oldMaterial = page.material;
          const newMaterial = new THREE.MeshBasicMaterial({
              map: oldMaterial.map, // Retain the texture
              side: THREE.DoubleSide, // If necessary for book pages
          });
          page.material = newMaterial
      });


  page0Mat = root.getObjectByName('page_0').material;
  page1Mat = root.getObjectByName('page_1').children[2].material;
  page2Mat = root.getObjectByName('page_1').children[1].material;
  page3Mat = root.getObjectByName('page_2').material;

  flame = root.getObjectByName("flame")


  scene.add(root);
  mixer = new THREE.AnimationMixer(root);
  //applyTexturesForSheet(currentSheet);

      //candle flame
  //mixer.clipAction(bookAnim[4]).setLoop(THREE.LoopRepeat);
  //mixer.clipAction(bookAnim[4]).play();



}

// ------------------------------ ANIMATION HELPERS ----------------------------
function playFlip(forward) {
    const clipIdx = forward ? 0 : 1;   // 0 = forward, 1 = backward
    const action  = mixer.clipAction(bookAnim[clipIdx]);
  
    mixer.stopAllAction();             // halt anything already running
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
  }
  
  /**
   * 1.  Put the target sheet’s four textures on the meshes
   * 2.  THEN play the flip animation
   *      → because every page image is already cached, the swap is instant
   * 3.  No 'finished' listener is required any more
   */
  function animateFlipAndSwap(forward, targetSheet) {
    currentSheet = targetSheet;            // update global index
    applyTexturesForSheet(currentSheet);   // 🟢 swap maps first
    playFlip(forward);    
    const firstPageOfSheet = (currentSheet - 1) * 2 + 1;
    playAudioForPage(firstPageOfSheet);                 // 🟢 then animate
  }
  

function nextSheet() {
  if (currentSheet >= NUM_SHEETS) return;
  animateFlipAndSwap(true, currentSheet + 1);
}

function prevSheet() {
  if (currentSheet <= 1) return;
  animateFlipAndSwap(false, currentSheet - 1);
}

function goToPage(page) {
  if (page < 1 || page > NUM_PAGES) {
    console.warn('Page out of range');
    return;
  }
  const targetSheet = Math.ceil(page / 2);
  currentSheet      = targetSheet;
  applyTexturesForSheet(targetSheet);

  const firstPageOfSheet = (currentSheet - 1) * 2 + 1;
  playAudioForPage(firstPageOfSheet);

}

// ------------------------------ CAMERA TRANSITIONS ---------------------------
let tweenEye, tweenTarget;

function goToCamera(eye, target) {
  const fromPos = { ...camera.position };
  tweenEye = new Tween(fromPos)
    .to({ x: eye[0], y: eye[1], z: eye[2] }, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.set(fromPos.x, fromPos.y, fromPos.z);
      controls.update();
    })
    .start();

  const fromTar = { ...controls.target };
  tweenTarget = new Tween(fromTar)
    .to({ x: target[0], y: target[1], z: target[2] }, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(() => controls.target.set(fromTar.x, fromTar.y, fromTar.z))
    .onComplete(() => controls.update())
    .start();
}

function goToPageCam(eye, target) {
  const deltaX = eye[0] - camera.position.x;
  const from   = { x: camera.position.x };
  tweenEye = new Tween(from)
    .to({ x: eye[0] }, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.set(from.x, camera.position.y, camera.position.z);
     // controls.update();
    })
    .start();

  const fromTar = { x: controls.target.x };
  tweenTarget = new Tween(fromTar)
    .to({ x: controls.target.x + deltaX }, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(() => controls.target.set(fromTar.x, controls.target.y, controls.target.z))
    .onComplete(() => controls.update())
    .start();
}


//------------------------------- AUDIO ------------------------------------------

const TOTAL_PAGES = 148;
const NUM_TRACKS  = 6;

/*  split 148 ≈ 24.7 pages per track
 *  first (TOTAL_PAGES % NUM_TRACKS) tracks get one extra page
 */
function buildPageAudioCues() {
  const cues = [];
  let page   = 1;
  for (let i = 1; i <= NUM_TRACKS; i++) {
    const pagesInThisSlice = Math.ceil((TOTAL_PAGES - cues.length) / (NUM_TRACKS - cues.length));
    cues.push({
      start : page,
      end   : page + pagesInThisSlice - 1,
      el    : document.getElementById(`track${i}`)
    });
    page += pagesInThisSlice;
  }
  return cues;
}

const pageAudioCues = buildPageAudioCues();

function playAudioForPage(page) {
  pageAudioCues.forEach(cue => {
    if (page >= cue.start && page <= cue.end) {
      if (cue.el.paused) cue.el.play();
    } else {
      cue.el.pause();
      cue.el.currentTime = 0;
    }
  });
}



// ------------------------------ DOM HOOKS ------------------------------------
const nextBtn      = document.getElementById('next-btn');
const prevBtn      = document.getElementById('previous-btn');
const goToBtn      = document.getElementById('go-to-btn');
const pageInput    = document.getElementById('sheet-num-input');
const startBtn     = document.getElementById('start-btn');
const closeBtn     = document.getElementById('close-btn');
const resetViewBtn = document.getElementById('reset-view-btn');
const camLeftBtn   = document.getElementById('cam-left-btn');
const camRightBtn  = document.getElementById('cam-right-btn');

nextBtn    && nextBtn.addEventListener('click', nextSheet);
prevBtn    && prevBtn.addEventListener('click', prevSheet);
goToBtn    && goToBtn.addEventListener('click', () => goToPage(parseInt(pageInput.value)));

// — start button logic (unchanged) -------------------------------------------
startBtn && startBtn.addEventListener('click', () => {
  if (window.innerWidth < 1300) {
    goToCamera(
      [-1.9153064930837553, 2.361142313198017, 0.07628112775956432],
      [-1.9153064890826725, 1.8612078653634396, 0.0681849639558673]
    );
  } else {
    goToCamera(
      [-0.7984355963931029, 2.1458759298750048, 0.030072785196943196],
      [-0.7984355923920204, 1.6459414820404277, 0.021976621393235994]
    );
  }

  // play opening flip (anim 2) once the model is ready
  if (bookAnim) {
    mixer.stopAllAction();             // halt anything already running
    mixer.clipAction(bookAnim[2]).setLoop(THREE.LoopOnce, 1)
    mixer.clipAction(bookAnim[2]).clampWhenFinished = true;
    mixer.clipAction(bookAnim[2]).play();
         
         

  }

  const rainAudio = document.getElementById('rain-audio');
  rainAudio && rainAudio.play();
});

// Optional: close / reset / side cams (left unchanged)
closeBtn && closeBtn.addEventListener('click', () => {
  if (!bookAnim) return;
  ['0', '1', '2'].forEach(i => mixer.clipAction(bookAnim[i]).stop());
  mixer.clipAction(bookAnim[3]).reset()
  mixer.clipAction(bookAnim[3]).setLoop(THREE.LoopOnce, 1)
  mixer.clipAction(bookAnim[3]).clampWhenFinished = true;
  mixer.clipAction(bookAnim[3]).play();
       
       

});

resetViewBtn && resetViewBtn.addEventListener('click', () => {
  goToCamera(
    [-0.7984355963931029, 2.1458759298750048, 0.030072785196943196],
    [-0.7984355923920204, 1.6459414820404277, 0.021976621393235994]
  );
});

camLeftBtn && camLeftBtn.addEventListener('click', () => {
  goToPageCam(
    [-2, 2.361142313198017, 0.07628112775956432],
    [-2, 1.8612078653634396, 0.0681849639558673]
  );
});

camRightBtn && camRightBtn.addEventListener('click', () => {
  goToPageCam(
    [0.04739493044643803, 2.361142313198017, 0.07628112775956432],
    [0.047394934447520826, 1.862283830461397, 0.0017455764570629556]
  );
});

// ------------------------------ LOAD SEQUENCE --------------------------------
Promise.all([
  preloadTextures(),
  new Promise(res => new RGBELoader().setPath('./assets/').load('brown_photostudio_01_2k.hdr', tex => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = tex;
    res();
  })),
  new Promise(res => new GLTFLoader().load('./assets/book_flip3.gltf', gltf => { buildBook(gltf); res(); }))
]).then(() => {

  setTimeout(function(){
    loadingDiv.style.display = 'none';
  },2000)
  
});

// ------------------------------ RENDER LOOP ----------------------------------

var time = 0;

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (mixer) mixer.update(clock.getDelta());

  if (tweenEye) tweenEye.update();
  if (tweenTarget) tweenTarget.update();

  const t = clock.elapsedTime;
    candleLight.intensity = 1.1 + 0.15 * Math.sin(t * 2.5);



    if(root){
    /* 🔹 colour oscillation: map sin() -> 0…1 and mix two RGB colours */
    const k = 0.5 * (1 + Math.sin(t * 2.5));   // 0‒1 once per second
    root.getObjectByName("pSphere1").material.color.setRGB(
    THREE.MathUtils.lerp(0xff / 255, 0xff / 255, k), // R stays 255
    THREE.MathUtils.lerp(0xb3 / 255, 0xd4 / 255, k), // G: 0xb3→0xd4
    THREE.MathUtils.lerp(0x3b / 255, 0x5a / 255, k)  // B: 0x3b→0x5a
    );

    time += 0.02; // adjust this for speed

    // Use sin and cos to create a subtle sway in two directions
    flame.rotation.x = Math.sin(time * 1.5) * 0.3; // sway on X axis
    flame.rotation.z = Math.cos(time) * 0.3;       // sway on Z axis
    flame.rotation.y = Math.cos(time) * 0.3;       // sway on Z axis
}
    


  renderer.render(scene, camera);
}
animate();

// ------------------------------ RESIZE ---------------------------------------
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});
