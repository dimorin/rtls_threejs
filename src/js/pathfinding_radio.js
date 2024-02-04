import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
/* import * as dat from '../../node_modules/lil-gui/dist/lil-gui.esm.js' */
import GUI from 'lil-gui';
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';

let $result;
let scene, camera, renderer, orbitControls;

if(WebGL.isWebGLAvailable()){    
    init();
}else{
    document.querySelector('#result').remove();
    document.body.append(WebGL.getWebGLErrorMessage());
}

function init(){    
    $result = document.querySelector('#result');

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color('lightgoldenrodyellow');

    // CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(33,10,10);
    camera.lookAt(0,0,0);
    
    // RENDERER
    renderer = new THREE.WebGLRenderer({
        canvas:$result,
        antialias:true,
        //alpha:true
    });
    renderer.setSize($result.clientWidth, $result.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // ORBIT CAMERA CONTROLS
    orbitControls = new OrbitControls(camera, $result);
    orbitControls.mouseButtons = {
        MIDDLE : THREE.MOUSE.ROTATE,
        RIGHT : THREE.MOUSE.PAN
    };
    orbitControls.enableDamping = true;
    orbitControls.enablePan = true;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 60;
    orbitControls.minPolarAngle = Math.PI/4;        // prevent to down view
    orbitControls.maxPolarAngle = Math.PI/2 - 0.05; // prevent camera below ground
    orbitControls.update();

    // LIGHTS
    const dLight = new THREE.DirectionalLight('white', 0.8);
    dLight.position.set(20, 30, 0);
    dLight.castShadow = true;
    dLight.shadow.mapSize.width = 4096;
    dLight.shadow.mapSize.height = 4096;
    const d = 35;
    dLight.shadow.camera.left = -d;
    dLight.shadow.camera.right = d;
    dLight.shadow.camera.top = d;
    dLight.shadow.camera.bottom = -d;
    scene.add(dLight);

    const aLight = new THREE.AmbientLight('white', 0.5);
    scene.add(aLight);

    // axes
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // 현관
    const room0 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room0.name = 'room0';
    room0.position.set(9.2,0.1,10.6);
    room0.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room0);
    // 회의실
    const room1 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room1.name = 'room1';
    room1.position.set(2.8,0.1,3);
    room1.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room1);
    // 연구소
    const room2 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room2.name = 'room2';
    room2.position.set(25,0.1,14);
    room2.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room2);
    // 공용룸
    const room3 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room3.name = 'room3';
    room3.position.set(28,0.1,5);
    room3.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room3);
    // 대표이사실
    const room4 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room4.name = 'room4';
    room4.position.set(29,0.1,14);
    room4.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room4);

    // AGENT
    const agentHeight = 1.0;
    const agentRadius = 0.2;
    const agent = new THREE.Mesh(new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight), new THREE.MeshPhongMaterial({color:'green'}));
    agent.position.y = agentHeight/2;
    const agentGroup = new THREE.Group();
    agentGroup.add(agent);
    //agentGroup.position.set(9,0,10);
    agentGroup.position.set(room0.position.x, room0.position.y, room0.position.z); // 현관에 서있기
    scene.add(agentGroup);

    var workers = [
        {name:'tom',color:'yellow',x:10,z:5},
        {name:'bob',color:'blue',x:15,z:8},
        {name:'duke',color:'orange',x:20,z:10}
    ]
    
    var workers_mesh = [];
    workers.forEach(function(worker){
        workers_mesh.push(new Worker({name:worker.name, color:worker.color, x:worker.x, z:worker.z}));
    });

    setInterval(function(){
        //console.log(, Math.random()*10);
        workers_mesh.forEach(function(worker_mesh){
            worker_mesh.setPosition(Math.floor(Math.random()*20), Math.floor(Math.random()*10));
        })
    }, 1000);
    
    // LOAD GEO
    const loader = new GLTFLoader();
    //loader.load('./src/models/geo2.glb', function(gltf){
    loader.load('./src/models/office_edgetoface.glb', function(gltf){
            scene.add(gltf.scene);
    });
 
    // Create level
    const pathfinding = new Pathfinding();
    const ZONE = 'level1';

    const pathfindinghelper = new PathfindingHelper();
    scene.add(pathfindinghelper);
    
    const SPEED = 5;
    let navmesh;
    let groupID;
    let navpath;
    // INITIALIZE PATH-FINDING
    //loader.load('./src/models/geo_navmesh.glb', function(gltf){
    loader.load('./src/models/office_edgetoface_navmesh.glb', function(gltf){    
        gltf.scene.traverse((node) => { // traverse 함수는 forEach 처럼 scene의 child 항목들을 반복적으로 검사하는 기능을 수행한다.
            if (!navmesh && node.isObject3D && node.children && node.children.length > 0) {
                navmesh = node.children[0];
                pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));// Create level의 일환
            }
        });
    });
    
    // RAYCASTING
    const raycaster = new THREE.Raycaster(); // create once
    const clickMouse = new THREE.Vector2();  // create once

    function intersect(pos) {
        raycaster.setFromCamera(pos, camera);
        return raycaster.intersectObjects(scene.children);
    }

    let target_position;
    var areas = document.querySelectorAll('input[name=area]');
    areas.forEach(function(area){
        area.addEventListener('change', function(){    
            // Find path from A(agentGroup.position) to B(target_position).    
            target_position = scene.getObjectByName(area.value).position;            
            groupID = pathfinding.getGroup(ZONE, agentGroup.position);//주어진 위치에 대해 가장 가까운 노드 그룹 ID를 반환합니다.         
            navpath = pathfinding.findPath(agentGroup.position, target_position, ZONE, groupID);//지정된 시작점과 끝점 사이의 경로를 반환합니다. 

            if (navpath) {
                // console.log(`navpath: ${JSON.stringify(navpath)}`);
                pathfindinghelper.reset();
                pathfindinghelper.setPlayerPosition(agentGroup.position);
                pathfindinghelper.setTargetPosition(target_position);
                pathfindinghelper.setPath(navpath);
            }
        });
    });


    window.addEventListener('click', event => {
        // THREE RAYCASTER
        clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        const found = intersect(clickMouse);
        if (found.length > 0) {
            let target = found[0].point;
            const agentpos = agentGroup.position;
            
            groupID = pathfinding.getGroup(ZONE, agentGroup.position);
            // find closest node to agent, just in case agent is out of bounds
            const closest = pathfinding.getClosestNode(agentpos, ZONE, groupID);            
            navpath = pathfinding.findPath(closest.centroid, target, ZONE, groupID);
            if (navpath) {
                // console.log(`navpath: ${JSON.stringify(navpath)}`);
                pathfindinghelper.reset();
                pathfindinghelper.setPlayerPosition(agentpos);
                pathfindinghelper.setTargetPosition(target);
                pathfindinghelper.setPath(navpath);
            }
        }
    });

    // MOVEMENT ALONG PATH
    function move ( delta) {
        if ( !navpath || navpath.length <= 0 ) return
    
        let targetPosition = navpath[ 0 ];
        const distance = targetPosition.clone().sub( agentGroup.position );
    
        if (distance.lengthSq() > 0.05 * 0.05) {
            distance.normalize();
            // Move player to target
            agentGroup.position.add( distance.multiplyScalar( delta * SPEED ) );
        } else {
            // Remove node from the path we calculated
            navpath.shift();
        }
    }

    // GAMELOOP
    const clock = new THREE.Clock();
    function gameLoop(){
        move(clock.getDelta());
        requestAnimationFrame(gameLoop);
        orbitControls.update();
        render();
    }
    gameLoop();

    window.addEventListener('resize', onWindowResize);   
}



function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    renderer.render( scene, camera );
}

function Worker(option){        
    this.name = option.name;
    this.workerHeight = 1.0;
    this.workerRadius = 0.2;
    this.position = {x:option.x,y:this.workerHeight/2, z:option.z};
    this.worker_mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.workerRadius, this.workerRadius, this.workerHeight), new THREE.MeshPhongMaterial({color:option.color}));
    
    scene.add(this.worker_mesh);
    
    this.getPosition = function(){
        return this.position;
    }
    this.setPosition = function(x,z){
        this.position.x = x;
        this.position.z = z;
        this.worker_mesh.position.set(this.position.x, this.position.y, this.position.z); 
    }
    this.setPosition(this.position.x, this.position.z);
}

