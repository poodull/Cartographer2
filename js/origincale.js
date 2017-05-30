/**
 * Created by Vamsi on 3/21/2017.
 */
var lastOriginIntersect; 
function setNewOrigin (intersects ) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    
    if(typeof lastOriginIntersect === "undefined"){
        lastOriginIntersect = [{'point':{x : 0,  y : 0 , z : 0}}];
    }

    if(!callUndoOrigin){
        addUndoOrigin('addOrigin' , lastOriginIntersect);
        lastOriginIntersect = intersects;    
    }

    /*try    
    originPlane = plane.clone();
    originPlane.position.x -= intersects[0].point.x;
    originPlane.position.y -= intersects[0].point.y;

    // return false;
    /*try*/
        
    // Origin is always 0,0 so the floor image moves.
    //floor.mesh.position.x -= intersects[0].point.x;
    //floor.mesh.position.y -= intersects[0].point.y;

    floor.originXPx = floor.building_offset_x - floor.mesh.position.x + (floor.imageWidthPx / 2);
    floor.originYPx = floor.mesh.position.y - floor.building_offset_y  + (floor.imageHeightPx / 2);


    _devices.deviceList.forEach(function (device, index, list) {
        if (device.mesh.floorID === floor.id) {
            //device.mesh.position.x -= intersects[0].point.x;
            //device.mesh.position.y -= intersects[0].point.y;
            //console.log(device.mesh.position);
            //device.mesh.deviceOutline.position.copy(device.mesh.position);
            var infoPosi = {
                x: ( device.mesh.position.x - intersects[0].point.x ),
                y: ( device.mesh.position.y - intersects[0].point.y ),
            }
            device['info'] = infoPosi;
        }
    });

    /*
    var polys =  [].concat(floor.gridData.polys);
    polys.forEach(function (poly, index, list) {
        poly.cubes.forEach(function (cube, index, list) {
            cube.position.x -= intersects[0].point.x;
            cube.position.y -= intersects[0].point.y;
            var pos = snapPoint(cube.position, _cubeSize);
            cube.position.copy(pos);
        });

        selectPoly(poly.polyId);
        redrawLine();
        floor.gridData.polys[index].line = _tempLine;
    });
    */
    createPlane();
}

function addUndoOrigin(typ , intersects ){
    _undo.push({'type' : typ , 'intersects' : intersects});        
}

var callUndoOrigin = false;
function callUndoOriginFunc(intersects){
    callUndoOrigin = true;
    setNewOrigin(intersects);
    callUndoOrigin = false;
}



function addUndoScale(typ , scale ){
    _undo.push({'type' : typ , 'scale' : scale});        
}

function callUndoScale(newScale){
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    floor.scale = newScale; // Appearance of floor in canvas is unchanged.
    reloadConfig();
}

function setNewScale (distance ,distancePx) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    addUndoScale("addScale" ,  floor.scale );
    var oldScale = floor.scale;
    var newScale = distancePx / distance;

    floor.scale = newScale; // Appearance of floor in canvas is unchanged.
    reloadConfig();
}

function reloadConfig(){
    saveConfig(true);
    if (typeof localStorage !== "undefined") {
        _drawMode.selectedObject = undefined;
        config = localStorage.getItem("config");
        loadConfig(new Blob([config], { type: "text/plain;charset=utf-8" }));
    }
}