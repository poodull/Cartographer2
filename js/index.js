var scene, camera, renderer, controls, container, raycaster, sceneVoxels, changes = 0, plane, _selectedDevice;

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
    showSubtoolBar();
    setTooltip();
    setOffSetTooltip();
    bindListeners();
    addDevice();
    editDevice();
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
        bindDrawEvent();
        //initDrawLine();
        //createVoxelAt();
        //redrawLine();
    } , 2000);
}

function bindDrawEvent () {
    container.addEventListener('mousedown', onDocumentMouseDownDraw, false);
    container.addEventListener('mouseup', onDocumentMouseUpDraw, false);
    container.addEventListener('mousemove', onDocumentMouseMoveDraw, false);
}

var _allCubes=[],_tempCubes=[], _cubeSize=5, _tempLine, _cursorVoxel, drawModeRun=false, _selectedDragDevice, lastMouseClick;
var _currentPen  = 0, _isCubesVisible=true, polylength=0; //default color

function showSubtoolBar() {
    $('a.myButton').click(function () {
        var classes = this.classList;
        $('div.subMenu').hide();
        for (var i = 0; i < classes.length; i++) {
            if ($('div').hasClass(classes[i])) {
                $('div.subMenu').hide();
                $('.' + classes[i]).show();
            }
        }
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        $('.toolbox-tools').attr('hidden', true);
        $('.deviceMenu').attr('hidden', true);
        removeMode();
        $('.thirdMenu').attr('hidden', true);
        $('.thirdMenu')[0].removeAttribute("style");
        $('.thirdMenu')[1].removeAttribute("style");
    });
}

function bindListeners () {

    $('a.myButton.file').addClass('active');
    document.onkeydown = onDocumentKeyDown;

    $('a.subMenuButton').click(function() {
        container.style.cursor = "default";
        $(this).siblings().removeClass('active');
        $('.toolbox-tools').attr('hidden', true);
        $('.deviceMenu').attr('hidden', true);
    });

    $('a.subMenuButton.penWalls, a.subMenuButton.selectWalls, a.subMenuButton.cutWalls, a.subMenuButton.drawWalls, a.subMenuButton.addDevice, a.subMenuButton.moveDevice, a.subMenuButton.originFloorImage, a.subMenuButton.scaleFloorImage').click(function() {
        container.style.cursor = "default";
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
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
        $('.toolbox-tools, .thirdMenu').attr('hidden', true);
        $('.thirdMenu')[1].removeAttribute("style");
        $('.originSubMenu')[0].removeAttribute('hidden');
        $('.originSubMenu.thirdMenu').attr('style', 'display:inline');
        $('.originFloorImage-dialog')[0].removeAttribute('hidden');
    });
    $('#scaleFloorImage').click( function () {
        $('.toolbox-tools, .thirdMenu').attr('hidden', true);
        $('.thirdMenu')[0].removeAttribute("style");
        $('.scaleSubMenu')[0].removeAttribute('hidden');
        $('.scaleSubMenu.thirdMenu').attr('style', 'display:inline');
        $('.scaleFloorImage-dialog')[0].removeAttribute('hidden');
    });
    $('.close-toolbox-tools').click( function () {
        $('.toolbox-tools').attr('hidden', true);
    });
    $('.penWalls').click( function () {
        controls.mouseButtons.ORBIT = -1;
        _drawMode.mode = ControlModes.DrawPoly;
        initDrawLine();
    });

    var wallType;
    $('.drawWalls').click( function () {
        controls.mouseButtons.ORBIT = -1;
        _drawMode.mode = ControlModes.DrawContinuePoly;
        initDrawLine();
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
    $('#deviceType').change( function () {
        setDropDown();
    });
    $('#loadFloorImage').change( function () {
        _floors.clear();
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
        } else {
            $('#confirmNew').dialog('open');
        }
    });

    $('.selectWalls').click( function () {
        _drawMode.mode = ControlModes.Select;
    });

    $('.deleteWalls').click( function () {
        removeSelectedPoly();
    });

    $('.cutWalls').click( function () {
        _drawMode.mode = ControlModes.CutPoly;
    });

    $('.device').click(function () {
        $('#deviceMenu')[0].removeAttribute('hidden');
        refreshDevices();
    });
    $('#deleteDevice').click(function () {
        deleteDevice();
    });
    $('#selectDevice').click(function () {
        selectDevice();
    });
    $('#moveDevice').click(function () {
        container.style.cursor = "crosshair";
        _drawMode.mode = ControlModes.MoveDevice;
    });
    $('#originFloorImage').click(function () {
        container.style.cursor = "crosshair";
        _drawMode.mode = ControlModes.SetOrigin;
    });
    $('#scaleFloorImage').click(function () {
        _drawMode.mode = ControlModes.SetScale;
    });
    $('#deviceContainerClose').click(function () {
        $('.deviceMenu').attr('hidden', true);
    });
    $('.addDevice').click(function () {
        controls.mouseButtons.ORBIT = -1;
        container.style.cursor = "crosshair";
        _drawMode.mode = ControlModes.AddDevice;
    });
    $('.editDevice').click(function () {
        controls.mouseButtons.ORBIT = -1;
        _drawMode.mode = ControlModes.EditDevice;
    });
    $('.panSelect').click(function () {
        _drawMode.mode = ControlModes.PanSelect;
    });
    $('.zoomOutSelect').click(function () {
        updateZoom(true, 0.95);
    });
    $('.zoomSelect').click(function () {
        updateZoom(false, 0.95);
    });
    container.addEventListener('mousedown', function () {
        onMouseDown(event);
    });
    container.addEventListener('mousemove', function () {
        showLocation();
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

function mouseMove() {
    var startEvent = {type: 'start'};
    var panEnd = new THREE.Vector2();
    var panDelta = new THREE.Vector2();
    var panStart = new THREE.Vector2();
    panEnd.set(event.clientX, event.clientY);
    panDelta.subVectors(panEnd, panStart);

    controls.constraint.pan(panDelta.x, panDelta.y);

    panStart.copy(panEnd);
    controls.dispatchEvent(startEvent);
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

function createElement (tag, id, name, type, css) {
        var element = document.createElement(tag);
        element.id = id;
        element.type = type;
        element.class = name;
        element.name = id;
        element.style.cssText = css;
        return element;
}
