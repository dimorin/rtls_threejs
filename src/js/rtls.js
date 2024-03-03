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
let objArr = [];
let main_element = document.querySelector('.main');
const $view_range = document.querySelector('#view_range');
const $scale_range = document.querySelector('#scale_range');
const $btn_init_camera = document.querySelector('.btn_init_camera');
const areas = document.querySelectorAll('input[name=area]');
let device = 'desktop';
var checked_radio;

if(WebGL.isWebGLAvailable()){    
    init();   
    setDevice(); 
}else{
    document.querySelector('#result').remove();
    main_element.append(WebGL.getWebGLErrorMessage());
}


function setDevice(){
    const htmlElem = document.querySelector('html');
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
        device = 'mobile';
        htmlElem.classList.remove('desktop');
        htmlElem.classList.add('mobile');
        orbitControls.enabled = true;
    } else {
        device = 'desktop';
        htmlElem.classList.remove('mobile');
        htmlElem.classList.add('desktop');
        orbitControls.enabled = false;
    }
}






function init(){  
    
    $result = document.querySelector('#result');

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#eeeeee');

    // CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,50,0);
    camera.lookAt(0,0,0);
    
    // RENDERER
    renderer = new THREE.WebGLRenderer({
        canvas:$result,
        antialias:true,
        //alpha:true
    });
    renderer.setSize($result.clientWidth, $result.clientHeight); 
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
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
    orbitControls.minPolarAngle = 0;                // prevent to down view
    orbitControls.maxPolarAngle = Math.PI/2 - 0.05; // prevent camera below ground
    orbitControls.update();
    orbitControls.addEventListener('change', function() {
        onCameraChange();
    });
    orbitControls.saveState();
    

    // LIGHTS
    const dLight = new THREE.DirectionalLight('white', 0.8);
    dLight.position.set(0, 30, 0);
    dLight.castShadow = true;
    dLight.shadow.mapSize.width = 2048;
    dLight.shadow.mapSize.height = 2048;
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
    room0.rotation.x = THREE.MathUtils.degToRad(90);
    
    // 회의실
    const room1 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room1.name = 'room1';    
    room1.rotation.x = THREE.MathUtils.degToRad(90);
    
    // 연구소
    const room2 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room2.name = 'room2';    
    room2.rotation.x = THREE.MathUtils.degToRad(90);
    
    // 공용룸
    const room3 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room3.name = 'room3';    
    room3.rotation.x = THREE.MathUtils.degToRad(90);
    
    // 대표이사실
    const room4 = new THREE.Mesh(new THREE.CircleGeometry(1), new THREE.MeshPhongMaterial({color:'darkseagreen', side:THREE.DoubleSide}));
    room4.name = 'room4';    
    room4.rotation.x = THREE.MathUtils.degToRad(90);    

    // AGENT
    var agent;
    var workers;    
    var workers_mesh = [];    
 
    // Create level
    const pathfinding = new Pathfinding();
    const ZONE = 'level1';
    let navmesh;

    let offsetX = 0;   
    let offsetZ = 0;

    async function loadMap(){
        const gltfLoader = new GLTFLoader();
        const promises = [
            gltfLoader.loadAsync("./src/models/office_edgetoface.glb"),
            gltfLoader.loadAsync("./src/models/office_edgetoface_navmesh.glb"),
        ];      
        const [...model] = await Promise.all(promises);
  
        // 지도와 지도의 navmesh가 모두 로드 된 후 할 일
        // 1. 지도를 scene의 한가운데 위치시킨다.
        let office = model[0].scene;             

        const boundingBox = new THREE.Box3().setFromObject(office);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        offsetX = -size.x /2;   
        offsetZ = -size.z/2;
        
        office.position.x = offsetX;
        office.position.z = offsetZ;
        office.traverse(child => {
            if(child.isMesh){                
                child.receiveShadow = true;
            }
        });        
        scene.add(office);

        room0.position.set(9.2+offsetX,0.1,10.6+offsetZ);
        scene.add(room0);
        room1.position.set(2.8+offsetX,0.1,3+offsetZ);
        scene.add(room1);
        room2.position.set(25+offsetX,0.1,14+offsetZ);
        scene.add(room2);
        room3.position.set(28+offsetX,0.1,5+offsetZ);
        scene.add(room3);
        room4.position.set(29+offsetX,0.1,14+offsetZ);
        scene.add(room4);

        agent = new Agent({objectType:'man', name:'agent',color:'green',x:room0.position.x,z:room0.position.z});
        workers = [
            {objectType:'man', name:'tom',color:'yellow',x:10+offsetX,z:5+offsetZ},
            {objectType:'man', name:'bob',color:'blue',x:15+offsetX,z:8+offsetZ},
            {objectType:'man', name:'duke',color:'orange',x:30+offsetX,z:10+offsetZ},
            {objectType:'man', name:'jake',color:'olive',x:20+offsetX,z:15+offsetZ},
            {objectType:'man', name:'brad',color:'purple',x:25+offsetX,z:14+offsetZ},
            {objectType:'man', name:'mary',color:'pink',x:28+offsetX,z:12+offsetZ}
        ];

        workers.forEach(function(worker){
            workers_mesh.push(new Agent({objectType:worker.objectType, name:worker.name, color:worker.color, x:worker.x, z:worker.z, isPathfindingHelper:false, type:'random'}));        
        });

        for(var i = 0; i <= workers_mesh.length; i++){        
            var mesh;
            if(i === workers_mesh.length){
                mesh = agent.agent_mesh;
            }else{
                mesh = workers_mesh[i].agent_mesh;
            }
            var divElem = document.createElement('div');
            divElem.classList.add('worker_name');
            /* divElem.style.position = 'absolute';
            divElem.style.transform = 'translate(-50%,0)';
            divElem.style.color = 'black'; */
            divElem.innerHTML = mesh.name;
            
            main_element.appendChild(divElem);
            var divObj = new THREE.Object3D();
            mesh.add(divObj);
            
            var objData = {
                mesh: mesh,
                divElem: divElem,
                divObj: divObj
            };
            objArr.push(objData);
        }

        // 2. office_navmesh의 중심점 이동(정점만 이동)
        let office_navmesh = model[1].scene;         
        office_navmesh.traverse((node) => { // traverse 함수는 forEach 처럼 scene의 child 항목들을 반복적으로 검사하는 기능을 수행한다.
            if (!navmesh && node.isObject3D && node.children && node.children.length > 0) {
                
                navmesh = node.children[0];
                //console.log(navmesh)
                navmesh.geometry.translate(offsetX,0,offsetZ);  // translate : geometry 객체의 정점들만 상대적으로 이동
                
                //scene.add(navmesh);
                pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));// Create level의 일환
                agent.pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
                workers_mesh.forEach(function(worker_mesh){
                    worker_mesh.pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
                })
            }
        });

        // 3. worker 위치 random
        randomWorkerPosition();
        setInterval(randomWorkerPosition, 3000);   
    }
    
    loadMap();

    function randomWorkerPosition(){
        workers_mesh.forEach(function(worker_mesh){
            var new_position = new THREE.Vector3((Math.random()*20)+10+offsetX, 0, Math.floor(Math.random()*10)+2+offsetZ);
            if(navmesh){
                worker_mesh.findNav(worker_mesh.agent_mesh.position, new_position, ZONE);
            }
        })
    }

    
    
    // RAYCASTING
    const raycaster = new THREE.Raycaster(); // create once
    const clickMouse = new THREE.Vector2();  // create once

    function intersect(pos) {
        raycaster.setFromCamera(pos, camera);
        return raycaster.intersectObjects(scene.children);
    }

    
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

            checked_radio = document.querySelector('input[type=radio][name=area]:checked');
            if(checked_radio){
                checked_radio.checked = false;
            }
        }
    });

    // draw
    const clock = new THREE.Clock();
    function draw(){    
            
        var delta = clock.getDelta();
        if(agent){
            agent.move(delta);
        }
        

        workers_mesh.forEach(function(worker_mesh){
            worker_mesh.move(delta);
        })

        
        orbitControls.update();
        onCameraChange();
        renderer.render( scene, camera );
        renderer.setAnimationLoop(draw);        
    }
    draw();
    

    window.addEventListener('resize', onWindowResize);   

    
    $view_range.max = 90;   // topview
    $view_range.min = 45;   // sideview
    $view_range.value = 90; // topview
    $view_range.addEventListener('input',function(){
        var radian = THREE.MathUtils.degToRad($view_range.value);   
        camera.position.x = 0;        
        camera.position.y = 50*Math.sin(radian);
        camera.position.z = 50*Math.cos(radian);
        camera.lookAt(0,0,0);
    });

    
    $scale_range.max = 65;   
    $scale_range.min = 25;   
    $scale_range.value = 45; 
    $scale_range.addEventListener('input',function(){
        camera.fov = $scale_range.value;
        camera.updateProjectionMatrix();
    });

    
    $btn_init_camera.addEventListener('click', init_camera)

    /* const gui = new GUI();    
    const folder1 = gui.addFolder('dLight.position');
    folder1.add(dLight.position, 'x', -50, 50);
    folder1.add(dLight.position, 'y', -50, 50);
    folder1.add(dLight.position, 'z', -50, 50); */
}
function init_camera(){        
    orbitControls.reset();
    if(device === 'desktop'){
        camera.position.x = 0;        
        camera.position.y = 50*Math.sin(Math.PI/2);
        camera.position.z = 50*Math.cos(Math.PI/2);            
        camera.fov = 45;
        camera.lookAt(0,0,0);
        camera.updateProjectionMatrix();
        $view_range.value = 90;
        $scale_range.value = 45; 
    }        
}
function onCameraChange()
{
    objArr.forEach(function(objData) {
        
        var proj = toScreenPosition(objData.divObj, camera);
        //console.log(proj);
        objData.divElem.style.left = proj.x + 'px';
        objData.divElem.style.top = proj.y + 'px';        
        
    });
}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();
    
    // TODO: need to update this when resize window
    var target = new THREE.Vector2();
    renderer.getSize(target);
    var widthHalf = 0.5*target.x;
    var heightHalf = 0.5*target.y;
    
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);
    
    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;
    
    return { 
        x: vector.x,
        y: vector.y
    };

}

function onWindowResize(){    
    setDevice();
    init_camera();
    if (window.matchMedia('(orientation: portrait)').matches) {
		// Portrait 모드일 때 실행할 스크립트
		// 폭과 높이가 같으면 Portrait 모드로 인식돼요
        //console.log("Portrait");
	} else {
		// Landscape 모드일 때 실행할 스크립트
        //console.log("Landscape");
	}
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render( scene, camera );
}



function Agent(option){     
    this.agentHeight = 1.0;
    this.agentRadius = 0.2;   
    this.name = option.name;   
    this.objectType = option.objectType; 
    this.speed = 3;
    this.isPathfindingHelper = (option.isPathfindingHelper === false) ? false : true;
    this.type = option.type;
    this.agent_mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.agentRadius, this.agentRadius, this.agentHeight), new THREE.MeshPhongMaterial({color:option.color}));
    this.agent_mesh.name = this.name;
    this.agent_mesh.objectType = this.objectType;
    this.agent_mesh.castShadow = true;
    this.agent_mesh.receiveShadow = true;
    scene.add(this.agent_mesh);           
    
    this.agent_mesh.geometry.translate(0,this.agentHeight/2,0);    
    this.agent_mesh.position.set(option.x,0,option.z);

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


/* 
    //polling
    var pollingID_dashboard;
    var pollingInterval_dashboard = 1000; //1초  
    getDashboard();
    startPolling_dashboard();

    function startPolling_dashboard(){
        pollingID_dashboard = setInterval(function(){
            getDashboard();          
        }, pollingInterval_dashboard);
    }  
    function stopPolling_dashboard(){
        clearInterval(pollingID_dashboard);
    } 
   
    function getDashboard(){               
        var url = "";
        var param = {};
        return;
        $.ajax({
            url:url,
            type : 'POST',
            dataType:'json',
            data : JSON.stringify(param),
            contentType: 'application/json',
            success : function(data){                 
                //update                        
            },
            error : function(data){                             
            }
        });            
    } 
*/  