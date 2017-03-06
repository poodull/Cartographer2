var scene, camera, renderer, controls, container, gui = {}, raycaster, sceneVoxels, changes = 0;

$(document).ready(function () {
    init();
    showSubtoolBar();
    setTooltip();
    setOffSetTooltip();
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
    renderer.setSize(window.innerWidth-65, window.innerHeight-25);
    container = document.getElementById('ThreeJS');
    container.appendChild( renderer.domElement );



    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = Math.PI * (4 / 8);
    controls.maxPolarAngle = Math.PI * (8 / 8);
    controls.minAzimuthAngle = Math.PI * (-1 / 8);
    controls.maxAzimuthAngle = Math.PI * (1 / 8);

    var ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = "ambientlight";
    scene.add(ambientLight);

    /*var controller = CARTOGRAPHER.Controller;
    container.addEventListener('mousemove', controller.onDocumentMouseMove, false);
    container.addEventListener('mousedown', controller.onDocumentMouseDown, false);
    container.addEventListener('mouseup', controller.onDocumentMouseUp, false);
    container.addEventListener('touchstart', controller.onDocumentTouchStart, false);
    window.addEventListener('resize', controller.onWindowResize, false);

    var floorPanel = new GUI.FloorPanel();
    floorPanel.domElement.style.position = 'absolute';
    floorPanel.domElement.style.bottom = '0px';
    floorPanel.domElement.style.left = '0px';
    container.appendChild(floorPanel.domElement);
    gui.FloorPanel = floorPanel;

    var deviceUI = new GUI.DeviceUI();
    GUI.IntervalRefresh(800);
    gui.DeviceUI = deviceUI;

    var deviceContextMenu = new GUI.DeviceContextMenu();
    gui.DeviceContextMenu = deviceContextMenu;

    var devicePanel = new GUI.DevicePanel();
    container.appendChild(devicePanel.domElement);
    gui.DevicePanel = devicePanel;
    gui.DevicePanelList = [];*/

    raycaster = new THREE.Raycaster();

    sceneVoxels = new THREE.Scene();
    var ambientLightVoxels = new THREE.AmbientLight(0xffffff);
    ambientLightVoxels.name = "ambientlightvoxels";
    sceneVoxels.add(ambientLightVoxels);
    renderer.autoClear = false;
}

function showSubtoolBar() {
$('a.myButton').click(function() {
    var classes = this.classList;
    $('div.subMenu').hide();
    for (var i = 0; i < classes.length; i++) {
        if ($('div').hasClass(classes[i])) {
            $('div.subMenu').hide();
            $('.' + classes[i]).show();
        }
    }
});
}

function bindListeners () {
    $('#importFile').click( function () {
        $('#loadConfig').trigger('click');
    });
    $('#exportFile').click( function () {
        saveConfig();
    });
    $('#captureFile').click( function () {
        captureImage();
    });
    $('#importFloorImage').click( function () {
        $('#loadFloorImage').trigger('click');
    });
    $('#originFloorImage').click( function () {
        $('.toolbox-tools').attr('hidden', true);
        $('.originFloorImage-dialog')[0].removeAttribute('hidden');
    });
    $('#scaleFloorImage').click( function () {
        $('.toolbox-tools').attr('hidden', true);
        $('.scaleFloorImage-dialog')[0].removeAttribute('hidden');
    });
    $('.close-toolbox-tools').click( function () {
        $('.toolbox-tools').attr('hidden', true);
    });
    $('#penWalls').click( function () {
        controls.mouseButtons.ORBIT = -1;
        _drawMode.mode = ControlModes.DrawPoly;
    });
    $('#loadConfig').change( function () {
        var file = $('#loadConfig').get(0).files[0];
        if (file) {
            loadConfig(file);
            $('#loadConfig').val("");
            changes = 1;
        }
    });
    $('#deviceType').change( function () {
        setDropDown();
    });
    $('#loadFloorImage').change( function () {
        var file = $('#loadFloorImage').get(0).files[0];
        if (file) {
            loadImage(file);
            $('#loadFloorImage').val("");
            changes = 1;
        }
    });

    $('#newFile, #clearFloorImage').click(function () {
        if (changes === 0) {
            _floors.clear();
            loadDefaultFloor();
            loadConfig(null);
            saveConfig(true);
        } else {
            $('#confirmNew').dialog('open');
        }
    });

    $('.device').click(function () {
        $('#deviceMenu')[0].removeAttribute('hidden');
    });
    $('.addDevice').click(function () {
        controls.mouseButtons.ORBIT = -1;
        container.style.cursor = "crosshair";
        _drawMode.mode = ControlModes.PlaceDevice;
    });
    container.addEventListener('mousedown', function () {
        onMouseDown(event);
    });

    if ($('#confirmNew').length) {
        $('#confirmNew').dialog({
            autoOpen: false,
            resizeable: false,
            height: 190,
            width: 450,
            modal: true,
            buttons: {
                Yes: function () {
                    $('#confirmNew').dialog("close");
                    _floors.clear();
                    loadDefaultFloor();
                    loadConfig(null);
                    saveConfig(true);
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
