/**
 * Created by Vamsi on 3/21/2017.
 */

var lastOriginIntersect;

/*
 function to move the devices to new origin without moving the floorimage
 */
function setNewOrigin(intersects) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];

    if (typeof lastOriginIntersect === "undefined") {
        lastOriginIntersect = [{'point': {x: 0, y: 0, z: 0}}];
    }

    if (!callUndoOrigin) {
        addUndoOrigin('addOrigin', lastOriginIntersect);
        lastOriginIntersect = intersects;
    }
    //calcuating the new floor position based on the origin selected
    floor.originXPx = floor.building_offset_x - floor.mesh.position.x + (floor.imageWidthPx / 2);
    floor.originYPx = floor.mesh.position.y - floor.building_offset_y + (floor.imageHeightPx / 2);

    //moving the devices to the new calculated position
    _devices.deviceList.forEach(function (device) {
        if (device.mesh.floorID === floor.id) {
            var infoPosi = {
                x: ( device.mesh.position.x - intersects[0].point.x ),
                y: ( device.mesh.position.y - intersects[0].point.y )
            };
            device['info'] = infoPosi;
        }
    });
    createPlane();
}

function addUndoOrigin(typ, intersects) {
    _undo.push({'type': typ, 'intersects': intersects});
}

var callUndoOrigin = false;
function callUndoOriginFunc(intersects) {
    callUndoOrigin = true;
    setNewOrigin(intersects);
    callUndoOrigin = false;
}


function addUndoScale(typ, scale) {
    _undo.push({'type': typ, 'scale': scale});
}

function callUndoScale(newScale) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    floor.scale = newScale; // Appearance of floor in canvas is unchanged.
    reloadConfig();
}

function setNewScale(distance, distancePx) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    addUndoScale("addScale", floor.scale);
    var newScale = distancePx / distance;

    floor.scale = newScale; // Appearance of floor in canvas is unchanged.
    reloadConfig();
}

/*
reloads the config based on the new scale or origin
 calls the loadconfig function
 */
function reloadConfig() {
    saveConfig(true);
    if (typeof localStorage !== "undefined") {
        _drawMode.selectedObject = undefined;
        config = localStorage.getItem("config");
        loadConfig(new Blob([config], {type: "text/plain;charset=utf-8"}));
    }
}