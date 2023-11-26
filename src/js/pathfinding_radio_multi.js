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
    var agent = new Agent({name:'agent',color:'green',x:room0.position.x,z:room0.position.z});

    var workers = [
        {name:'tom',color:'yellow',x:10,z:5},
        {name:'bob',color:'blue',x:15,z:8},
        {name:'duke',color:'orange',x:30,z:10},
        {name:'jake',color:'olive',x:20,z:15},
        {name:'brad',color:'purple',x:25,z:14},
        {name:'mary',color:'pink',x:28,z:12}
    ]
    
    var workers_mesh = [];
    workers.forEach(function(worker){
        workers_mesh.push(new Agent({name:worker.name, color:worker.color, x:worker.x, z:worker.z, isPathfindingHelper:false, type:'random'}));
    });

    setInterval(function(){
        workers_mesh.forEach(function(worker_mesh){
            var new_position = new THREE.Vector3((Math.random()*20)+10, 0, Math.floor(Math.random()*10)+2);
            if(navmesh){
                worker_mesh.findNav(worker_mesh.agent_mesh.position, new_position, ZONE);
            }
        })
    }, 3000);    
 
    const loader = new GLTFLoader();
    loader.load('./src/models/office_edgetoface.glb', function(gltf){
            scene.add(gltf.scene);
    });
 
    // Create level
    const pathfinding = new Pathfinding();
    const ZONE = 'level1';
    let navmesh;  
    
    loader.load('./src/models/office_edgetoface_navmesh.glb', function(gltf){    
        gltf.scene.traverse((node) => { // traverse 함수는 forEach 처럼 scene의 child 항목들을 반복적으로 검사하는 기능을 수행한다.
            if (!navmesh && node.isObject3D && node.children && node.children.length > 0) {
                navmesh = node.children[0];
                pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));// Create level의 일환
                agent.pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
                workers_mesh.forEach(function(worker_mesh){
                    worker_mesh.pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
                })
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

    var areas = document.querySelectorAll('input[name=area]');
    areas.forEach(function(area){
        area.addEventListener('change', function(){               
            agent.findNav(agent.agent_mesh.position, scene.getObjectByName(area.value).position, ZONE);
        });
    });

    window.addEventListener('click', event => {
        // THREE RAYCASTER
        clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        const found = intersect(clickMouse);
        if (found.length > 0) {
            let target_position = found[0].point;     
            agent.findNav(agent.agent_mesh.position, target_position, ZONE);
        }
    });

    // GAMELOOP
    const clock = new THREE.Clock();
    function gameLoop(){        
        var delta = clock.getDelta();
        agent.move(delta);

        workers_mesh.forEach(function(worker_mesh){
            worker_mesh.move(delta);
        })

        renderer.setAnimationLoop(gameLoop);
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

function Agent(option){     
    this.agentHeight = 1.0;
    this.agentRadius = 0.2;   
    this.name = option.name;    
    this.speed = 3;
    this.isPathfindingHelper = (option.isPathfindingHelper === false) ? false : true;
    this.type = option.type;
    this.agent_mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.agentRadius, this.agentRadius, this.agentHeight), new THREE.MeshPhongMaterial({color:option.color}));
    scene.add(this.agent_mesh);           
    
    this.setPosition = function(x,z){
        this.agent_mesh.position.set(x,this.agentHeight/2,z);
    }
    this.setPosition(option.x, option.z);

    this.pathfinding = new Pathfinding();
    this.pathfindinghelper = new PathfindingHelper();
    if(this.isPathfindingHelper){
        scene.add(this.pathfindinghelper);
    }   
    
    this.groupID;
    this.navepath;    
    this.findNav = function(a, b, zone){
        // Find path from A(agentGroup.position) to B(target_position).               
        this.groupID = this.pathfinding.getGroup(zone, a);//주어진 위치에 대해 가장 가까운 노드 그룹 ID를 반환합니다.         
        
        // find closest node to agent, just in case agent is out of bounds
        const closestA = this.pathfinding.getClosestNode(a, zone, this.groupID);//navmesh에서 a 위치와 가장 가까운 노드
        const closestB = this.pathfinding.getClosestNode(b, zone, this.groupID);//navmesh에서 b 위치와 가장 가까운 노드
        if(this.type === 'random'){
            this.navpath = this.pathfinding.findPath(closestA.centroid, closestB.centroid, zone, this.groupID);
        }else{
            this.navpath = this.pathfinding.findPath(a, b, zone, this.groupID);//지정된 시작점과 끝점 사이의 경로를 반환합니다.
        }
        

        if (this.navpath) {
            this.pathfindinghelper.reset();
            this.pathfindinghelper.setPlayerPosition(a);
            this.pathfindinghelper.setTargetPosition(b);
            this.pathfindinghelper.setPath(this.navpath);
        }
    }

    // MOVEMENT ALONG PATH
    this.move = function(delta){
        if ( !this.navpath || this.navpath.length <= 0 ) return
    
        let targetPosition = this.navpath[ 0 ];
        const distance = targetPosition.clone().sub( this.agent_mesh.position );
 
        if (distance.lengthSq() > 0.05 * 0.05) {
            distance.normalize();
            // Move player to target
            this.agent_mesh.position.add( distance.multiplyScalar( delta * this.speed ) );            
        } else {
            // Remove node from the path we calculated
            this.navpath.shift();
        }
    }
}