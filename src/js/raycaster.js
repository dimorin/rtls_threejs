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
    document.querySelector('#result').remove();
    document.body.append(WebGL.getWebGLErrorMessage());
}

function init(){
    $result = document.querySelector('#result');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 10000);
    camera.position.set(500,80,1300);
    camera.lookAt(0,0,0);
    
    // roll-over helpers
    const rollOverGeo = new THREE.BoxGeometry(10,10,10);
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

    // axes
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



    /**
     * Raycaster 의 기본 설정
     */
    const raycaster_t = new THREE.Raycaster();
    const rayOrigin_t = new THREE.Vector3(10, 10, 0);
    const rayDirection_t = new THREE.Vector3(10, 10, 20);
    rayDirection_t.normalize();
    raycaster_t.set(rayOrigin_t, rayDirection_t);
    scene.add(new THREE.ArrowHelper(raycaster_t.ray.direction, raycaster_t.ray.origin, 100, 0xffff00) ); 
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
    // 광선을 올바른 방향으로 향하게 하기 위해 setFromCamera를 사용한다.
    // 마우스가 raycaster의 origin, 카메라가 direction 으로 설정되어
    // 마우스를 기준으로 ray를 cast 하고, 마우스가 hover 됨에 따라  ray에 교차된 object 정보를 얻게된다.
    raycaster.setFromCamera(pointer, camera);
    scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 1000, 0x000000) );
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