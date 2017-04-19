/**
 * Created by Vamsi on 3/3/2017.
 */

var _drawMode = new drawMode();

function removeWall (floor) {
    if(floor.gridData && floor.gridData.polys.length < 1)return false;

    if (floor.gridData) {
        $.each(floor.gridData.polys , function(i, poly){
            scene.remove(poly.line);
            $.each(poly.cubes , function(j , cube){
                scene.remove(cube);
            })
        });
        floor.gridData.polys=[];
    }

    $.each(_tempCubes , function(i , cube){
        scene.remove(cube);
    });

    scene.remove(_tempLine);
    scene.remove(_cursorVoxel);
    _tempCubes = [];
    _tempLine=undefined;
}

function redrawLine () {
    if (_tempCubes.length < 1) {
        return false;
    }

    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver", linewidth: 1});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var endPoint, firstPoint;

    for (var i = 0; i < _tempCubes.length; i++) {
        endPoint = snapPoint(_tempCubes[i].position, _cubeSize);
        geometry.vertices.push(endPoint);
        firstPoint = firstPoint || endPoint;
    }
    if (typeof _drawMode.selectedObject !== "undefined") {
        endPoint = snapXYZ(_drawMode.selectedObject.point.x, _drawMode.selectedObject.point.y, z, _cubeSize);
        geometry.vertices.push(endPoint);
    }

    if (_tempCubes.length > 0) {
        material.color = _tempCubes[0].material.color;
    }

    if (_tempLine !== undefined) {
        scene.remove(_tempLine);
    }

    _tempLine = new THREE.Line(geometry, material);
    _tempLine.name = "tempLine_"+((new Date).getMilliseconds());
    scene.add(_tempLine);

}

var continueLinePoly;
function commitPoly () {
    if( _tempCubes.length < 2 ){
        return false;
    }

    var random = Math.floor(Math.random() * 1000) + 1  ;
    var poly = {
        polyId: _tempCubes[0].id || random,
        cubes: _tempCubes,
        line:  _tempLine,
        color: _tempCubes[0].pen,
        lineId:_tempLine.id
    };

    if (typeof continueLinePoly == "undefined") {
        if(typeof arguments[0] == "undefined"){
            _floors.floorData[_floors.selectedFloorIndex].gridData.polys.push(poly);
        }else{
            _floors.floorData[_floors.selectedFloorIndex].gridData.polys[arguments[0]] = poly;
        }
    } else {
        var  contPoly, polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
        $.each(polys , function(i, eachpoly){
            if(eachpoly.polyId == continueLinePoly.polyId ){
                var index = polys.indexOf(eachpoly);
                polys[index] = poly;
                contPoly = eachpoly;
            }
        });
    }

    saveConfig(true);
}

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

function lastTouchPoint () {
    return lastMouseClick;
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

    var _cubeGeometry = new THREE.CubeGeometry(_cubeSize, _cubeSize, _cubeSize);

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

function loadWalls (polys) {
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    if (polys.length) {
        $.each(polys, function (i, poly) {
            _tempCubes=[];
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