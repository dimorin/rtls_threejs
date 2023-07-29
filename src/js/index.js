import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let $result;
let scene, camera, renderer, controls;
let plane;
let pointer, raycaster, isShiftDown = false;

let rollOverMesh, rollOverMaterial;
let cubeGeo, cubeMaterial;

let objects = [];

if(WebGL.isWebGLAvailable()){
    init();
    animate();
}else{
    document.body.appendChild(WebGL.getWebGLErrorMessage());
}

function init(){
    $result = document.querySelector('#result');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 10000);
    camera.position.set(500,80,1300);
    camera.lookAt(0,0,0);
    
    // roll-over helpers
    const rollOverGeo = new THREE.BoxGeometry(50,50,50);
    rollOverMaterial = new THREE.MeshBasicMaterial({
        color:0xff0000,
        opacity:0.5,
        transparent:true
    });
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(rollOverMesh);

    // cubes
    cubeGeo = new THREE.BoxGeometry(50,50,50);
    cubeMaterial = new THREE.MeshLambertMaterial({
        color:0xfeb74c
    });

    // 마우스 클릭 준비
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    const geometry = new THREE.PlaneGeometry(1000, 1000);
    geometry.rotateX(-Math.PI/2);

    plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        //visible:false
    }));
    scene.add(plane);

    objects.push(plane);


    // lights
    const ambientLight = new THREE.AmbientLight(0x606060, 3);
    scene.add(ambientLight);
    
    const directionallight = new THREE.DirectionalLight(0xffffff, 3);
    directionallight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionallight);

    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // grid
    const gridHelper = new THREE.GridHelper( 1000, 20 );
	scene.add( gridHelper );

    controls = new OrbitControls(camera, $result);
    controls.update();

    renderer = new THREE.WebGLRenderer({
        canvas:$result,
        antialias:true,
        //alpha:true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize($result.clientWidth, $result.clientHeight);

    // pointer events are DOM events that are fired for a pointing device such as mouse, pen/stylus or touch.
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);

    window.addEventListener('resize', onWindowResize);    
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function onPointerMove(event){
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(objects, false);
    if(intersects.length > 0){
        const intersect = intersects[0];
        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        render();
    }
}

function onPointerDown(event){
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(objects, false);
    if(intersects.length > 0){
        const intersect = intersects[0];
        if(isShiftDown){    // shift 누른채 클릭하면 cube 삭제됨
            if(intersect.object != plane){
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object),1);
            }
        }else{  // create cube
            const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            voxel.position.copy(intersect.point).add(intersect.face.normal);
            voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
            scene.add(voxel);
            objects.push(voxel);
        }
        
        render();
    }
}

function onDocumentKeyDown(event){
    switch(event.keyCode){
        case 16 : isShiftDown = true; break; // shift
    }
}

function onDocumentKeyUp(event){
    switch(event.keyCode){
        case 16 : isShiftDown = false; break; // shift
    }
}

function render() {
    renderer.render( scene, camera );
}

/* function onMouseClick(event){
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
    
} */