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
            break;
    }
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