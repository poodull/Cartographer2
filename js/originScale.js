/**
 * Created by Vamsi on 3/21/2017.
 */
function setNewOrigin (intersects) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];

    floor.originXPx = floor.building_offset_x - floor.mesh.position.x + (floor.imageWidthPx / 2);
    floor.originYPx = floor.mesh.position.y - floor.building_offset_y + (floor.imageHeightPx / 2);

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

function setNewScale (distance ,distancePx) {
    var floor = _floors.floorData[_floors.selectedFloorIndex];
    var newScale = distancePx/distance;

    floor.scale = newScale; // Appearance of floor in canvas is unchanged.
    reloadConfig();
}

function reloadConfig () {
    saveConfig(true);
    if (typeof localStorage !== "undefined") {
        _drawMode.selectedObject = undefined;
        config = localStorage.getItem("config");
        loadConfig(new Blob([config], { type: "text/plain;charset=utf-8" }));
    }
}