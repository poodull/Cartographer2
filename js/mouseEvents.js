/**
 * Created by Vamsi on 3/3/2017.
 */

/*
function to add mouse down in add device mode
 */
function onMouseDown (e) {
    if (e.button == 0) {
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
        }
    }
}

function updateZoom (isZoomOut, scale) {
    var startEvent = {type: 'start'};
    var endEvent = {type: 'end'};
    if(isZoomOut){
        controls.constraint.dollyIn(scale);
    }else{
        controls.constraint.dollyOut(scale);
    }
    controls.update();
    controls.dispatchEvent(startEvent);
    controls.dispatchEvent(endEvent);
}

/*
function to show the location of a device on hover
reads the geoloaction of the deivice from the floor and displays its coordinates
 */
function showLocation () {
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

/*
function to get the location of the device from the floor
 */
function getLocation (device) {
    if (device != null) {
        floor = _floors.floorData[_floors.selectedFloorIndex];
        var devPos;
        if (device.mesh === null) {
            devPos = device.position;
        } else {
            devPos = device.info ||  device.mesh.position;
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

/*
function to remove the current mode after a complete action is done
 */
function removeMode () {
    $(".subMenu").children().removeClass('active');
    container.style.cursor = "default";
    _drawMode.mode = '';
    $.each(selectedPolys, function (i, poly) {
        poly.line.material.color = new THREE.Color('red');
        $.each(poly.cubes, function (i, cube) {
            cube.material.color = new THREE.Color('red');
        });
    });
    selectedPolys = [];
}

/*
function to call all keyboard events
removemode is called for every complete action performed
 */
function onDocumentKeyDown (e) {
    var keyevent = window.event ? event : e;
    switch (keyevent.keyCode) {
        case 27:
            if ((_drawMode.mode == ControlModes.DrawPoly || _drawMode.mode == ControlModes.DrawContinuePoly ) && _tempLine) {
                scene.remove(_cursorVoxel);
                stopDrawWall();
                drawModeRun = false;
            } else if (_drawMode.mode == ControlModes.Select && _tempSelectLine) {
                removeSelectWallBox();
            } else if (_drawMode.mode == ControlModes.Select) {
                removeSelectWallBox();
                removeMode();
            } else if (_drawMode.mode == ControlModes.DrawPoly || _drawMode.mode == ControlModes.DrawContinuePoly) {
                scene.remove(_cursorVoxel);
                removeMode();
            } else {
                removeMode();
            }
            hidPolyInfo();
            break;
    }
}
