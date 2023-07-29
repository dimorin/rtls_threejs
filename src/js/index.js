import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let $result;
let scene, camera, renderer, controls;
let meshes = [];

if(WebGL.isWebGLAvailable()){
    init();
    animate();
}else{
    document.body.appendChild(WebGL.getWebGLErrorMessage());
}

function init(){
    $result = document.querySelector('#result');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffe287);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(2,2,2);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({
        canvas:$result,
        antialias:true,
        alpha:true
    });
    renderer.setSize($result.clientWidth, $result.clientHeight);

    const ambientLight = new THREE.AmbientLight(0x606060, 3);
    scene.add(ambientLight);
    
    const directionallight = new THREE.DirectionalLight(0xffffff);
    directionallight.position.set(2,4,3);
    scene.add(directionallight);

    const geometry = new THREE.BoxGeometry(1,1,1);
    const material = new THREE.MeshStandardMaterial({
        color:0x2e6ff2,
    });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);

    controls = new OrbitControls(camera, $result);
    controls.update();

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // grid
    const gridHelper = new THREE.GridHelper( 1000, 20 );
	scene.add( gridHelper );

    window.addEventListener('resize', onWindowResize);
    //window.addEventListener('click', onMouseClick);
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event){
    event.preventDefault();

    // get mouse coordinates relative to the viewport
    const mouse = new THREE.Vector2();
    // DOM 내의 좌표 값을 -1 ~ 1 좌표로 변환
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // -1 ~ 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // 1 ~ -1
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera); // 깊이 값을 추출한다. origin:mouse, direction:camera

    const plane = new THREE.Plane(new THREE.Vector3(0,0,1),0);
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    createMesh(intersection.x, intersection.y);

 

}

function createMesh(x, y){
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
        color:0x00ff00
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,0);
    scene.add(mesh);
    meshes.push(mesh);
    
}