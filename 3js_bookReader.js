
import * as THREE from 'three';
import { GLTFLoader } from "./three/GLTFLoader.js";
import { OrbitControls } from './three/OrbitControls.js';
import { RGBELoader } from './three/RGBELoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const container = document.getElementById("threejscanvas")



const renderer = new THREE.WebGLRenderer({canvas: container});
renderer.setSize( container.clientWidth, container.clientHeight );

//document.body.appendChild( renderer.domElement );'


const controls = new OrbitControls( camera, renderer.domElement );

camera.position.z = 2;
camera.position.y = 1;

controls.target.set(0, 1, 0);;
//controls.update();

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );

const light2 = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0);
scene.add( light2 );     

let bookScene;
let bookAnim;
let mixer;
let labels = [];



var clock = new THREE.Clock()
var delta = clock.getDelta();




var nextBtn = document.getElementById("next-btn");

nextBtn.addEventListener("click",function(){

    mixer.clipAction(bookAnim[1]).stop(); 
    mixer.clipAction(bookAnim[0]).loop = THREE.LoopOnce ; 
    mixer.clipAction(bookAnim[0]).clampWhenFinished = true;
    mixer.clipAction(bookAnim[0]).play(); 

})

var previousBtn = document.getElementById("previous-btn");

previousBtn.addEventListener("click",function(){

    mixer.clipAction(bookAnim[0]).stop(); 
    mixer.clipAction(bookAnim[1]).loop = THREE.LoopOnce ; 
    mixer.clipAction(bookAnim[1]).clampWhenFinished = true;
    mixer.clipAction(bookAnim[1]).play(); 

})

// ---------------------------------------------------------------------
// HDRI - IMAGE BASED LIGHTING
// ---------------------------------------------------------------------
new RGBELoader()
.setPath('./assets/')
.load('brown_photostudio_01_2k.hdr', function (texture) {

    
    texture.mapping = THREE.EquirectangularReflectionMapping;

    

    
    //scene1.background = texture;
    scene.background = new THREE.Color( "rgb(1,22,45)" );
    scene.environment = texture;
    scene.environment.rotation = 180

});

var loadingManager = new THREE.LoadingManager();




const loader = new GLTFLoader(loadingManager);
loader.load(
// resource URL
'./assets/book_flip.glb',
//'https://storage.googleapis.com/dheerajv-bucket/images/aorta.glb',
// called when the resource is loaded
function ( gltf ) {


    bookScene = gltf.scene;
    bookAnim = gltf.animations;
    scene.add( bookScene);

    console.log(bookAnim)

    mixer = new THREE.AnimationMixer(bookScene);





});







function animate() {
    requestAnimationFrame( animate );

    if (mixer) {
        mixer.update(0.01); // Update animation with time delta
    }





    renderer.render( scene, camera );

}
animate();

