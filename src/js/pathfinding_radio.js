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

    // AGENT
    const agentHeight = 1.0;
    const agentRadius = 0.2;
    const agent = new THREE.Mesh(new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight), new THREE.MeshPhongMaterial({color:'green'}));
    agent.position.y = agentHeight/2;
    const agentGroup = new THREE.Group();
    agentGroup.add(agent);
    agentGroup.position.set(9,0,10);
    scene.add(agentGroup);

    // 회의실
    const room1 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'green', side:THREE.DoubleSide}));
    room1.name = 'room1';
    room1.position.set(2.8,0.1,3);
    room1.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room1);
    // 연구소
    const room2 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'green', side:THREE.DoubleSide}));
    room2.name = 'room2';
    room2.position.set(25,0.1,14);
    room2.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room2);
    // 공용룸
    const room3 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'green', side:THREE.DoubleSide}));
    room3.name = 'room3';
    room3.position.set(28,0.1,5);
    room3.rotation.x = THREE.MathUtils.degToRad(90);
    scene.add(room3);
    
    // LOAD GEO
    const loader = new GLTFLoader();
    //loader.load('./src/models/geo2.glb', function(gltf){
    loader.load('./src/models/office_edgetoface.glb', function(gltf){
            scene.add(gltf.scene);
    });
 
    const pathfinding = new Pathfinding();
    const pathfindinghelper = new PathfindingHelper();
    scene.add(pathfindinghelper);
    const ZONE = 'level1';
    const SPEED = 5;
    let navmesh;
    let groupID;
    let navpath;
    // INITIALIZE PATH-FINDING
    //loader.load('./src/models/geo_navmesh.glb', function(gltf){
    loader.load('./src/models/office_edgetoface_navmesh.glb', function(gltf){    
        gltf.scene.traverse((node) => {
            if (!navmesh && node.isObject3D && node.children && node.children.length > 0) {
                navmesh = node.children[0];
                pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
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
            target_position = scene.getObjectByName(area.value).position;
            const agentpos = agentGroup.position;
          
            groupID = pathfinding.getGroup(ZONE, agentGroup.position);
            const closest = pathfinding.getClosestNode(agentpos, ZONE, groupID);            
            navpath = pathfinding.findPath(closest.centroid, target_position, ZONE, groupID);
            if (navpath) {
                // console.log(`navpath: ${JSON.stringify(navpath)}`);
                pathfindinghelper.reset();
                pathfindinghelper.setPlayerPosition(agentpos);
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
            // console.log(`agentpos: ${JSON.stringify(agentpos)}`);
            // console.log(`target: ${JSON.stringify(target)}`);

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