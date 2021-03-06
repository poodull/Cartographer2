var scene, camera, renderer, controls, container, raycaster, sceneVoxels, changes = 0, plane;

var CubeColors = {
    Red: 0,
    Orange: 1,
    Yellow: 2,
    Green: 3,
    Blue: 4,
    Indigo: 5,
    Violet: 6,
    properties: {
        0: { name: "red", hex: "#FF0000", attn: [0, 0, 0, 0, 0] },
        1: { name: "orange", hex: "#FF7F00", attn: [0, 0, 0, 0, 0] },
        2: { name: "yellow", hex: "#FFFF00", attn: [0, 0, 0, 0, 0] },
        3: { name: "green", hex: "#00FF00", attn: [0, 0, 0, 0, 0] },
        4: { name: "blue", hex: "#00FFFF", attn: [0, 0, 0, 0, 0] },
        5: { name: "indigo", hex: "#0000FF", attn: [0, 0, 0, 0, 0] },
        6: { name: "violet", hex: "#8B00FF", attn: [0, 0, 0, 0, 0] }
    }
};
$(document).ready(function () {
    init();
    bindListeners();
    var config = null;
    if (typeof localStorage !== "undefined")
        config = localStorage.getItem("config");
    if (config !== null) {
        loadConfig(new Blob([config], { type: "text/plain;charset=utf-8" }));
    }
    else {  // Load default floor image.
        loadDefaultFloor();
    }
    animate();
});

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(20, window.innerWidth/window.innerHeight, 0.1, 10000);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth-25, window.innerHeight-25);
    container = document.getElementById('ThreeJS');
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = Math.PI * (4 / 8);
    controls.maxPolarAngle = Math.PI * (8 / 8);
    controls.minAzimuthAngle = Math.PI * (-1 / 8);
    controls.maxAzimuthAngle = Math.PI * (1 / 8);
    controls.enableRotate = false;

    var ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = "ambientlight";
    scene.add(ambientLight);

    raycaster = new THREE.Raycaster();

    sceneVoxels = new THREE.Scene();
    var ambientLightVoxels = new THREE.AmbientLight(0xffffff);
    ambientLightVoxels.name = "ambientlightvoxels";
    sceneVoxels.add(ambientLightVoxels);
    renderer.autoClear = false;


    setTimeout(function(){
        createPlane();
    } , 2000);
}

var _tempCubes=[], _cubeSize=5, _tempLine, _cursorVoxel, lastMouseClick;
var _currentPen  = 0, _isCubesVisible=true, polylength=0; //default color


function bindListeners () {


    $('#importFile').click( function () {
        $('#loadConfig').trigger('click');
    });
    $('#loadConfig').change( function () {
        _floors.clear();
        var file = $('#loadConfig').get(0).files[0];
        if (file) {
            loadConfig(file);
            $('#loadConfig').val("");
            changes = 1;
        }
    });

    $('#clearFloorImage').click(function () {
        if (changes === 0) {
            _floors.clear();
            loadDefaultFloor();
            loadConfig(null);
        } else {
            $('#confirmNew').dialog('open');
        }
    });

    if ($('#confirmNew').length) {
        $('#confirmNew').dialog({
            autoOpen: false,
            resizeable: false,
            width: 450,
            modal: true,
            buttons: {
                Yes: function () {
                    $('#confirmNew').dialog("close");
                    _floors.clear();
                    $('.custom-dialog').attr('hidden', true);
                    loadDefaultFloor();
                    loadConfig(null);
                    saveConfig(true);
                    changes = 0;
                },
                No: function () {
                    $('#confirmNew').dialog("close");
                }
            }
        });
    }
}

function animate () {
    requestAnimationFrame(animate);
    render();
    update();
}

function render () {
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(sceneVoxels, camera);
}

function update() {
    controls.target.z = 0;  // Lock camera control target to this altitude (but still allow x/y pan).
}

function drawAxesHelper(length, altitude) {
    if (typeof scene.axes !== "undefined")
        scene.remove(scene.axes);

    altitude = altitude || 0;

    scene.axes = new THREE.AxisHelper(length);
    scene.axes.name = "axes_z" + altitude;
    scene.axes.position.z = altitude;
    scene.add(scene.axes);
}
