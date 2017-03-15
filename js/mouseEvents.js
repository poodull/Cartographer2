/**
 * Created by Vamsi on 3/3/2017.
 */
function onMouseDown (e) {
    e.preventDefault();

    switch (_drawMode.mode) {
        case ControlModes.AddDevice:
            $('#addDeviceMenu').dialog('open');
            var $div = $(e.target);
            var offset = $div.offset();
            var x = e.clientX - offset.left;
            var y = e.clientY - offset.top;
            addDevice(x, y);
            break;
        case ControlModes.EditDevice:
            $("#editDeviceMenu").dialog('open');
            editDevice();
            break;
        case ControlModes.SetOrigin:
            raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
            var intersects = raycaster.intersectObject(plane, true);

            if (intersects.length > 0) {
                var floor = _floors.floorData[_floors.selectedFloorIndex];

                // Origin is always 0,0 so the floor image moves.
                floor.mesh.position.x -= intersects[0].point.x;
                floor.mesh.position.y -= intersects[0].point.y;

                // Also calculate the new origin in pixels (which may be needed when loading this floor from a file again).
                floor.originXPx = floor.building_offset_x - floor.mesh.position.x + (floor.imageWidthPx / 2);
                floor.originYPx = floor.mesh.position.y - floor.building_offset_y + (floor.imageHeightPx / 2);

                // Recalculate locations of all devices on this floor.
                _devices.deviceList.forEach(function (device) {
                    if (device.mesh.floorID === floor.id) {
                        device.mesh.position.x -= intersects[0].point.x;
                        device.mesh.position.y -= intersects[0].point.y;
                        device.mesh.deviceOutline.position.copy(device.mesh.position);
                    }
                });

                // Recalculate locations of polys. NOTE that since poly cubes are meant to snap to a discrete voxel,
                // each poly may shift a little.
                floor.gridData.polys.forEach(function (poly) {
                    poly.cubes.forEach(function (cube) {
                        cube.position.x -= intersects[0].point.x;
                        cube.position.y -= intersects[0].point.y;
                        var pos = snapPoint(cube.position, _cubeSize);
                        cube.position.copy(pos);
                    });

                    selectPoly(poly.polyId);
                    redrawLine();
                    commitPoly(false);
                });

                initGrid(floor.mesh.position.x, floor.mesh.position.y, floor.gridData.originZ, floor.imageWidthPx, floor.imageHeightPx,
                    floor.gridData.cubeSize, floor.gridData.polys, floor.gridData.plane);
            }
            break;
    }
}

var zoomLevel = 1;

function updateZoom (zoom) {
    var canvas = $('canvas');
    var context = canvas[0].getContext("2d");
    zoomLevel += zoom;
    context.scale(zoomLevel,zoomLevel);
}

function showLocation() {
    var intersects = raycaster.intersectObjects(_devices.visibleDevices, true);
    if (intersects.length > 0) {
        if (intersects[0].object != _selectedDevice) {
            if (_selectedDevice) {
                scene.remove(_selectedDevice.deviceOutline);
            }
            _selectedDevice = intersects[0].object;
            scene.add(_selectedDevice.deviceOutline);
            getLocation(_devices.getDevice(_selectedDevice.deviceID));
        }
    }
    else {
        if (_selectedDevice) {
            scene.remove(_selectedDevice.deviceOutline);
        }
        _selectedDevice = null;
        $('#deviceDetailsLocation').remove();
    }
}

function getLocation (device) {
    if (device != null) {
        floor = _floors.floorData[_floors.selectedFloorIndex];
        var devPos;
        if (device.mesh === null) {
            devPos = device.position;
        } else {
            devPos = device.mesh.position;
        }
        var devX = devPos.x / floor.scale,
            devY = devPos.y / floor.scale,
            devName = device.name;

        var location = createElement('div', "deviceDetailsLocation", 'font-family:Roboto;font-size:16px;color:white;text-align:center');
        location.innerHTML = devX.toFixed(2) + "," + devY.toFixed(2);
        location.style.left = (event.clientX + 10) + "px";
        location.style.top = event.clientY + "px";
        location.style.visibility = "visible";
        var text = createElement('div', "deviceDetailsText", 'font-family:Roboto;font-size:16px;color:white;text-align:center');
        text.innerHTML = devName;
        container.appendChild(location);
        container.appendChild(text);
    }
}

function onDocumentKeyDown(e) {
    var keyevent = window.event ? event : e;
    switch (keyevent.keyCode) {
        case 27:
            $(".subMenu").children().removeClass('active');
            container.style.cursor = "default";
            _drawMode.mode = '';
            break;
    }
}
