import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
/* import * as dat from '../../node_modules/lil-gui/dist/lil-gui.esm.js' */
import GUI from 'lil-gui';

let $result;
let scene, camera, renderer, controls;
let plane;
let pointer, raycaster, isShiftDown = false;

let rollOverMesh, rollOverMaterial;
let cubeGeo, cubeMaterial;

let objects = [];

let lycat, innerwall, outwall;

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

    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.set(0,5,5);
    camera.lookAt(0,0,0);
    
    //
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./src/models/Lycat-3d.glb', function(gltf){
        lycat = gltf.scene;
        scene.add(lycat);
        lycat.scale.set(0.02,0.02,0.02);
        lycat.position.set(2,0,2);
    });
    gltfLoader.load('./src/models/innerwall.glb', function(gltf){
        innerwall = gltf.scene;
        innerwall.scale.set(10,10,10);
        scene.add(innerwall);
        // 모델의 바운딩 박스를 얻어 크기를 계산
        /* const boundingBox = new THREE.Box3().setFromObject(innerwall);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        console.log('innerwall size:', size.x, size.y, size.z); */
        innerwall.position.set(0,0,2.3081374168395996);
    });
    gltfLoader.load('./src/models/outwall.glb', function(gltf){
        outwall = gltf.scene;
        scene.add(outwall);
        // 모델의 바운딩 박스를 얻어 크기를 계산
        /* const boundingBox = new THREE.Box3().setFromObject(outwall);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        console.log('outwall size:', size.x, size.y, size.z); */
        outwall.position.set(0,0,2.4125397205352783);
    });
            
    // roll-over helpers
    const rollOverGeo = new THREE.BoxGeometry(50,50,50);
    rollOverMaterial = new THREE.MeshBasicMaterial({
        color:0xff0000,
        opacity:0.5,
        transparent:true
    });
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    //scene.add(rollOverMesh);

    // cubes
    cubeGeo = new THREE.BoxGeometry(50,50,50);
    cubeMaterial = new THREE.MeshLambertMaterial({
        color:0xfeb74c
    });

    // 마우스 클릭 준비
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    const geometry = new THREE.PlaneGeometry(10, 10);
    geometry.rotateX(-Math.PI/2);

    plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        //visible:false
    }));
    scene.add(plane);

    objects.push(plane);

    const texture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/132.png' ); 
    const test_plane_material = new THREE.MeshBasicMaterial( { map:texture, transparent: true } );
    let test_plane_geo = new THREE.PlaneGeometry(0.5,0.5);
    test_plane_geo.rotateX(-Math.PI/2);
    let test_plane = new THREE.Mesh(test_plane_geo, test_plane_material);
    scene.add(test_plane);

    // lights
    const ambientLight = new THREE.AmbientLight(0x606060, 3);
    scene.add(ambientLight);
    
    const directionallight = new THREE.DirectionalLight(0xffffff, 3);
    directionallight.position.set(0, 5, 0).normalize();
    scene.add(directionallight);

    // axes
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // grid
    const gridHelper = new THREE.GridHelper();
	scene.add( gridHelper );

    controls = new OrbitControls(camera, $result);
    controls.update();
    
    const gui = new GUI();
    const folder1 = gui.addFolder('camera.position');
    folder1.add(camera.position, 'x', -10, 10);
    folder1.add(camera.position, 'y', -10, 10);
    folder1.add(camera.position, 'z', -10, 10);
    const folder2 = gui.addFolder('directionallight.position');
    folder2.add(directionallight.position, 'x', -10, 10);
    folder2.add(directionallight.position, 'y', -10, 10);
    folder2.add(directionallight.position, 'z', -10, 10);
    const folder3 = gui.addFolder('Orbit Controls');
    folder3.add(controls,'enabled');
    folder3.add(controls,'enableDamping');
    folder3.add(controls,'enablePan');
    folder3.add(controls,'enableRotate');
    folder3.add(controls,'enableZoom');
    folder3.add(controls,'minPolarAngle');
    folder3.add(controls,'maxPolarAngle');

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
        // face:면
        // normal : 삼차원 공간에서 공간에 있는 평면 위의 한 점을 지나면서 그 평면에 수직인 직선
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
    const intersects = raycaster.intersectObjects(objects, false);
    if(intersects.length > 0){
        const intersect = intersects[0];
        console.log(intersect.point);
        console.log(intersect.face.normal);
        /* if(isShiftDown){    // shift 누른채 클릭하면 cube 삭제됨
            if(intersect.object != plane){
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object),1);
            }
        }else{  // create cube            
            const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            voxel.position.copy(intersect.point).add(intersect.face.normal); // copy와 add는 Vector3의 메소드다.
            voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25); // 50 단위씩 위치하게 하기 위함.
            scene.add(voxel);
            objects.push(voxel);
        } */        
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

