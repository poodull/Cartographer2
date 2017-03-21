/**
 * Created by Vamsi on 3/3/2017.
 */

var _drawMode = new drawMode();
var ControlModes = {
    Orbit: 'camera',
    EraseDots: 'eraseDots',
    SetScale: 'setScale',
    SetOrigin: 'setOrigin',
    DeviceManager: 'deviceManager',
    PlaceDevice: 'placeDevice',
    AddDevice: 'addDevice',
    MoveDevice: 'moveDevice',
    EditDevice: 'editDevice',
    DrawPoly: 'drawPoly',
    Select: 'select'
};
var _tempScaleCube = [], selectDrawBox = false;
var _tempScaleLine, _tempSelectLine, _tempSelectCubes=[];

function initDrawLine () {
    initCursorVoxel(_cubeSize);
    createPlane();
}

function initCursorVoxel(cursorSize) {
    _cursorVoxel = new THREE.Mesh(new THREE.CubeGeometry(cursorSize, cursorSize, cursorSize), new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: .5,
        side: THREE.DoubleSide,
        color: "silver",
        depthWrite: true
    }));
    scene.add(_cursorVoxel);
}

function stopDrawWall () {
    $.each(_tempCubes , function(i , cube){
        scene.remove(cube);
    });
    scene.remove(_tempLine);
    scene.remove(_cursorVoxel);
    _tempCubes = [];
    _tempLine = undefined;
}

function onDocumentMouseDownDraw (event) {
    event.preventDefault();

    lastMouseClick = getTouchPoint(event.clientX , event.clientY);
    //loadDefaultFloor();
    _drawMode.mouseX = ((event.clientX - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((event.clientY - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);

    switch(_drawMode.mode ){
        case ControlModes.DrawPoly:
            var intersects = raycaster.intersectObjects(_allCubes.concat((_tempCubes.concat([plane]))), true);
            _drawMode.selectedObject =intersects[0];
            //debugger;
            var voxel = createVoxelAt(_drawMode.selectedObject.point , CubeColors.properties[_currentPen].hex);
            scene.add(voxel);
            _tempCubes.push(voxel);
            //console.log('voxel' , voxel);

            if(drawModeRun == true){
                drawModeRun = false;
                redrawLine();
                commitPoly();
                commitPoly();

                return false;
            }
            drawModeRun = true;
        break;

        case ControlModes.Select:
            if (selectDrawBox) {
                scene.remove(_tempSelectLine);
                scene.remove(_cursorVoxel);

                $.each(_tempSelectCubes , function(i ,cube){
                    scene.remove(cube);
                });

                _tempSelectCubes=[];
                _tempSelectLine = "undefined";
                selectDrawBox = false;
            } else {
                initCursorVoxel(_cubeSize);
            }

            var intersects = raycaster.intersectObjects(_allCubes.concat((_tempSelectCubes.concat([plane]))), true);
            _drawMode.selectedObject = intersects[0];

            var voxel = createVoxelAt(_drawMode.selectedObject.point , "silver");
            scene.add(voxel);

            _tempSelectCubes.push(voxel);

            if(_tempSelectCubes.length > 1){
                scene.remove(_tempSelectLine);
                drawSelectWall(intersects[0]);
                selectDrawBox = true;
            }
            break;

        case ControlModes.MoveDevice:
            var intersects = raycaster.intersectObjects(_devices.meshList.concat(plane), true);
            if(intersects[0].object.name.startsWith("device_")){
                //console.log(intersects[0].object);
                _selectedDragDevice = intersects[0].object;

            }
        break;

        case ControlModes.SetOrigin:
            var intersects = raycaster.intersectObject(plane, true);

            if(intersects.length > 0 ){
                setNewOrigin(intersects);
            }
        break;

        case ControlModes.SetScale:
            initCursorVoxel(_cubeSize);

            var intersects = raycaster.intersectObjects(_allCubes.concat((_tempCubes.concat([plane]))), true);
            _drawMode.selectedObject =intersects[0];
            //debugger;
            var voxel = createVoxelAt(_drawMode.selectedObject.point , 'silver');
            scene.add(voxel);
            _tempScaleCube.push(voxel);
        break;

        default:
        break;

}
}

function removeSelectedPoly () {
    if(_tempSelectCubes.length !== 2)return false;

    var  tpLeft ,btRight,z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    if(_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
        && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y ){
        tpLeft =_tempSelectCubes[1].position;
        btRight =_tempSelectCubes[0].position;
    }else if(_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
        && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y ){
        tpLeft =_tempSelectCubes[0].position;
        btRight =_tempSelectCubes[1].position;
    }else if(_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
        && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y ){

        tpLeft = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);
        btRight = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
    }else if(_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
        && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y ){

        tpLeft = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
        btRight = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);

    }
    var polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    for (var i = 0; i < polys.length; i++) {
        var inP=false;
        for (var j = 0; j < polys[i].cubes.length; j++) {
            var cube = polys[i].cubes[j];
            inP = checkBound(cube.position , tpLeft,btRight);
            if(inP === false )break;
        }

        if(inP == true){
            scene.remove(polys[i].line);
            $.each(polys[i].cubes , function(i, cube){
                scene.remove(cube);
            });
            polys.splice(i,1);
            saveConfig(true);
        }
    }
}

function checkBound (point, tpLeft , btRight) {
    if( tpLeft.x <= point.x && point.x <= btRight.x && tpLeft.y <= point.y && point.y <= btRight.y ) {
        return true;
    }
    return false;
}

function selectPoly (id) {
    
    var polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    _selectedPoly = findPoly(id);
    if (_selectedPoly === undefined) {
        return;
    }


    _tempLine = _selectedPoly.line; //for redrawline
    _tempCubes = _selectedPoly.cubes; //for redrawline
    // console.log(_tempLine.name);
    if (_tempLine !== undefined) {
        scene.remove(_tempLine);
    }
}

function findPoly(id) {
    var polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    for (var i = 0; i < polys.length; i++) {
        if (polys[i].polyId === id) {
            return polys[i];
        }
    }
    return undefined;
}

function redrawLine () {
    if(_tempCubes.length < 1) {
        return false;
    }

    if (_tempLine !== undefined) {
        scene.remove(_tempLine);
    }

    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver"});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var endPoint;

    for (var i = 0; i < _tempCubes.length; i++) {
        endPoint = snapPoint(_tempCubes[i].position, _cubeSize);
        geometry.vertices.push(endPoint);
    }
    if (_drawMode.mode === ControlModes.DrawPoly && typeof endPoint !== "undefined") {
        endPoint = snapXYZ(_drawMode.selectedObject.point.x, _drawMode.selectedObject.point.y, z, _cubeSize);
        geometry.vertices.push(endPoint);
    }
    // console.log(geometry.vertices.length);

    if (_tempCubes.length > 0)
        material.color = _tempCubes[0].material.color;

    // console.log(_tempLine);
    _tempLine = new THREE.Line(geometry, material);
    _tempLine.name = "tempLine_"+((new Date).getMilliseconds());
    scene.add(_tempLine);
}

function commitPoly () {
    // scene.add(_tempLine);
    var poly = {
        polyId: _tempCubes[0].id,
        cubes: _tempCubes,
        line: _tempLine,
        color: _tempCubes[0].pen
    };

    _floors.floorData[_floors.selectedFloorIndex].gridData.polys.push(poly);
    saveConfig(true);
    _tempCubes = [];
    _tempLine=undefined;
}


//initgrid function Cartographer
function createPlane () {
    var index = 0;
    if (_floors.selectedFloorIndex > 0) {
        index = _floors.selectedFloorIndex || 0;
    }

    var selectedFloor = _floors.floorData[index];

    var width = selectedFloor.mesh.geometry.parameters.width;
    var height = selectedFloor.mesh.geometry.parameters.height;
    var geometry = new THREE.PlaneBufferGeometry(width, height);

    plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        visible: false,
        depthWrite: false
    }));

    plane.position.x = selectedFloor.mesh.position.x;
    plane.position.y = selectedFloor.mesh.position.y;
    plane.position.z = selectedFloor.mesh.position.z;
    plane.name = "plane";
    scene.add(plane);

    if (typeof selectedFloor.gridData === "undefined" || typeof selectedFloor.gridData.devices === "undefined") {
        selectedFloor.gridData = {
            'polys': [],
            'plane': plane,
            'cubeSize': _cubeSize
        };
    }
}

function onDocumentMouseMoveDraw (event) {
    event.preventDefault();
    //_cursorVoxel.visible = false;

    //loadDefaultFloor();
    _drawMode.mouseX = ((event.clientX - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((event.clientY - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;


    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
    var intersects = raycaster.intersectObject(plane, true);
    if (intersects.length > 0) {
        if (_drawMode.mode == ControlModes.DrawPoly) {
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;

            _drawMode.selectedObject = intersects[0];

            if(_tempCubes.length < 1)return false;
            redrawLine();
        } else if(_drawMode.mode == ControlModes.Select &&  _tempSelectCubes.length) {
            // _tempSelectCubes
            //debugger;
            if(selectDrawBox)return false;
            if( _tempSelectLine !== "undefined"){
                scene.remove(_tempSelectLine);
            }
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;

            drawSelectWall(intersects[0]);
        } else if (typeof _selectedDragDevice !== "undefined") {
            var offset = new THREE.Vector3();
            _selectedDragDevice.position.copy(intersects[0].point.sub(offset));
            _selectedDragDevice.deviceOutline.position.copy(intersects[0].point.sub(offset));
        } else if(_drawMode.mode == ControlModes.SetScale) {
            if(_tempScaleCube.length < 1)return false;

            if(_tempScaleLine !== "undefined"){
                scene.remove(_tempScaleLine);
            }

            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;

            _drawMode.selectedObject = intersects[0];
            

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({color: "silver"});    // Default line color. Should be set to the poly's color or the color of the cubes.
            var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
            var endPoint;


            endPoint = snapPoint(_tempScaleCube[0].position, _cubeSize);
            geometry.vertices.push(endPoint);
            
            endPoint = snapXYZ(_drawMode.selectedObject.point.x, _drawMode.selectedObject.point.y, z, _cubeSize);
            geometry.vertices.push(endPoint);
            

            
            // console.log(geometry.vertices.length);

            if (_tempScaleCube.length > 0)
                material.color = _tempScaleCube[0].material.color;

            // console.log(_tempLine);
            _tempScaleLine = new THREE.Line(geometry, material);
            _tempScaleLine.name = "tempScaleLine";
            scene.add( _tempScaleLine );
        }
    }
}

function onDocumentMouseUpDraw() {
    if (_drawMode.mode == ControlModes.SetScale) {
        if (_tempScaleCube.length && typeof _tempScaleLine !== "undefined") {
            var distanceX = Math.abs(_tempScaleCube[0].position.x - _tempScaleCube[1].position.x);
            var distanceY = Math.abs(_tempScaleCube[0].position.y - _tempScaleCube[1].position.y);
            var distancePx = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            //remove allscene
            scene.remove(_tempScaleCube[0]);
            scene.remove(_tempScaleCube[1]);

            scene.remove(_tempScaleLine);

            _tempScaleCube = [];
            _tempScaleLine = undefined;

            //jquery dialoge not working
            // var dialog = $('#frmScale');
            // dialog.data('distancePx', distancePx);
            // dialog.dialog("open");

            var distance = prompt("Distance in meters : ", "");
            if (distance != null) {
                setNewScale(distance, distancePx);
            }
        }
    } else if (typeof _selectedDragDevice !== "undefined") {
        _selectedDragDevice = undefined;
        saveConfig(true);
    }
}

function drawSelectWall (selectedObject) {
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver"});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var endPoint;

    //point one
    var endPointFirst = snapPoint(_tempSelectCubes[0].position, _cubeSize);
    geometry.vertices.push(endPointFirst);

    //point three
    endPoint = snapXYZ(_tempSelectCubes[0].position.x, selectedObject.point.y, z, _cubeSize);
    geometry.vertices.push(endPoint);

    //point two
    endPoint = snapXYZ(selectedObject.point.x, selectedObject.point.y, z, _cubeSize);
    geometry.vertices.push(endPoint);


    //point four
    endPoint = snapXYZ(selectedObject.point.x, _tempSelectCubes[0].position.y,  z, _cubeSize);
    geometry.vertices.push(endPoint);

    geometry.vertices.push(endPointFirst);


    if (_tempSelectCubes.length > 0){
        material.color = _tempSelectCubes[0].material.color;
    }
    _tempSelectLine = new THREE.Line(geometry, material);
    _tempSelectLine.name = "tempSelectLine";
    scene.add( _tempSelectLine );

}

function lastTouchPoint () {
    return lastMouseClick;
}

function getTouchPoint (x , y) {
    if( typeof plane == "undefined" ){
        createPlane();
    }

    _drawMode.mouseX = ((x - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((y - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
    //debugger;
    var intersects = raycaster.intersectObject(plane, true);
    var point;
    if (intersects.length > 0) {
        point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
    }
    return  point;
}

function createVoxelAt (point, color) {
    var material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        color: color,
        depthWrite: false,
        visible: _isCubesVisible
    });

    _cubeGeometry = new THREE.CubeGeometry(_cubeSize, _cubeSize, _cubeSize);

    var voxel = new THREE.Mesh(_cubeGeometry, material);
    voxel.position.copy(point);
    if (typeof _drawMode.selectedObject !== "undefined" && typeof _drawMode.selectedObject.face !== "undefined")
        voxel.position.add(_drawMode.selectedObject.face.normal);
    voxel.position.divideScalar(_cubeSize).floor().multiplyScalar(_cubeSize).addScalar(_cubeSize / 2);
    voxel.position.z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    voxel.name = "cube" + _currentPen + '_' + voxel.position.x + ',' + voxel.position.y;
    voxel.pen = _currentPen;
    voxel.polyIndex = polylength++;
    return voxel;
}

function selectRect (){
    var geometry = new THREE.PlaneGeometry(2, 1);
    var material = new THREE.MeshBasicMaterial({
        color: 0xDB1E1E
        //wireframe: true
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function loadWalls (polys) {
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    if (polys.length) {
        $.each(polys, function (i, poly) {
            $.each(poly.points, function (i, point) {
                var snpoint = snapXYZ(point.x, point.y, z, _cubeSize);
                var voxel = createVoxelAt(snpoint, CubeColors.properties[_currentPen].hex);
                scene.add(voxel);
                _tempCubes.push(voxel)
            });
            redrawLine();
            commitPoly();
        });
    }
}

function snapXYZ (x, y, z, gridSize) {
    return new THREE.Vector3(x, y, z)
        .divideScalar(gridSize).floor().multiplyScalar(gridSize).addScalar(gridSize / 2);
}

function snapPoint (point, gridSize) {
    return new THREE.Vector3(point.x, point.y, point.z)
        .divideScalar(gridSize).floor().multiplyScalar(gridSize).addScalar(gridSize / 2);
}


function drawMode () {
    var mode = 0;
    var startX = undefined;
    var startY = undefined;
    var selectedObject = undefined;
    var mouseX = undefined;
    var mouseY = undefined;
}