
import * as THREE from 'three';
import { GLTFLoader } from "./three/GLTFLoader.js";
import { OrbitControls } from './three/OrbitControls.js';
import { RGBELoader } from './three/RGBELoader.js';

import {Tween,Easing} from './tween/tween.esm.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const container = document.getElementById("threejscanvas")



const renderer = new THREE.WebGLRenderer({canvas: container});
renderer.setSize( container.clientWidth, container.clientHeight );

//document.body.appendChild( renderer.domElement );'


const controls = new OrbitControls( camera, renderer.domElement );

camera.position.x = -1;
camera.position.y = 1;
camera.position.z = 4;

controls.target.set(-1, 1, 1);;
//controls.update();

//spotlight

const spotLight = new THREE.SpotLight(0xffffff,0.75,5,0.5,1,0,4); // White light, intensity 1
spotLight.position.set(-5, 4, -3); // Position the spotlight

scene.add(spotLight);

spotLight.castShadow = true;

// Target for the spotlight
const spotLightTarget = new THREE.Object3D();
spotLightTarget.position.set(0, 0, 0); // Point the spotlight at the origin
scene.add(spotLightTarget);
spotLight.target = spotLightTarget;

// Add a helper to visualize the spotlight
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
//scene.add(spotLightHelper);

const light2 = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0);
scene.add( light2 );     

let bookScene;
let bookAnim;
let mixer;
let labels = [];



var clock = new THREE.Clock()
var delta = clock.getDelta();


var startBtn = document.getElementById("start-btn");

startBtn.addEventListener("click",function(){

    goToCamera([-0.7984355963931029,2.1458759298750048,0.030072785196943196],[-0.7984355923920204,1.6459414820404277,0.021976621393235994 ])
    this.style.display = "none"

    
})




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
.load('blue_photo_studio_2k.hdr', function (texture) {

    
    texture.mapping = THREE.EquirectangularReflectionMapping;

    

    
    //scene1.background = texture;
    scene.background = new THREE.Color( "rgb(1,22,45)" );
    scene.environment = texture;
    scene.environmentRotation = 0.2
    //scene.environment.intensity = 0.1;
    console.log(scene.environmentRotation)

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



//camera

var tween_eye,tween_target;

var cameraTransitionTime = 2000 //milliseconds

function goToCamera(eye,target){

  //eye
  var from = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
  
  var to = {
    x: eye[0],
    y: eye[1],
    z: eye[2],
  };
   tween_eye = new Tween(from,false)
    .to(to, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(function () {
    camera.position.set(from.x,from.y,from.z);
    //camera.lookAt(new THREE.Vector3(0, 0, -0.5));
    //controls.target = new THREE.Vector3(0, 0, -0.5)
    controls.update()
    
  })

    .start();



    //target
  var from_target = {
    x: controls.target.x,
    y: controls.target.y,
    z: controls.target.z
  };
  
  var to_target = {
    x: target[0],
    y: target[1],
    z: target[2],
  };
   tween_target = new Tween(from_target,false)
    .to(to_target, cameraTransitionTime)
    .easing(Easing.Quadratic.InOut)
    .onUpdate(function () {
    //camera.lookAt(from_target.x,from_target.y,from_target.z);
    //camera.lookAt(new THREE.Vector3(0, 0, -0.5));
    controls.target.set(from_target.x,from_target.y,from_target.z)
    //controls.update()
    
  })
    .onComplete(function () {
    //controls.target.copy(scene.position);
    //controls.update()

  })
    .start();
}

document.addEventListener("keydown", function(e){

    if(e.key == "l"){
    var lookAt = (new THREE.Vector3( 0, 0, -0.5 )).applyQuaternion( camera.quaternion ).add( camera.position ); //get lookat vector, 0.5 is distance from camera
    console.log("[" + camera.position.x + "," + camera.position.y + "," + camera.position.z + "],[" + lookAt.x + "," + lookAt.y + "," + lookAt.z,"]")
  }
  
  
  if(e.key == "c"){
  
    console.log(controls.target)
  }

  if(e.key=="s"){

    //goToCamera([-0.7984355963931029,2.1458759298750048,0.030072785196943196],[-0.7984355923920204,1.6459414820404277,0.021976621393235994 ])
  }
});



function animate(time) {
    requestAnimationFrame( animate );

    if (mixer) {
        mixer.update(0.01); // Update animation with time delta
    }

    if(tween_eye){
        
        tween_eye.update(time)
        tween_target.update(time)
     }





    renderer.render( scene, camera );

}
animate();

