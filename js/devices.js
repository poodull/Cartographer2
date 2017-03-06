/**
 * Created by Vamsi on 3/6/2017.
 */

function addDevice (x, y) {
    var dialog = $('#addDeviceMenu').dialog({
        autoOpen: false,
        resizeable: false,
        height: 350,
        width: 375,
        modal: true,
        buttons: {
            "OK": function () {
                //set up a new device object based on field inputs
                var device = {
                    id: $("#txtDeviceID").val(),
                    name: $("#txtDeviceName").val().substr(0,15),
                    model: $("#deviceModel").val(),
                    deviceType: $("#deviceType").val()
                };
                var selectedFloor = _floors.floorData[_floors.selectedFloorIndex];
                //Check for Duplicate Devices
                if (device.name.length && device.id.length) {
                    if (_devices.getDevice(device.id) != null) {
                        alert("duplicate ID");
                    }
                    else {
                        //Create the device, if no duplicates
                        loadDevice(device, x, y, selectedFloor.id);
                        device.mesh.scale.setLength(10);
                        device.mesh.deviceOutline.scale.setLength(12);
                        scene.add(device.mesh);
                        scene.add(device.mesh.edges);
                        _devices.visibleDevices.push(device.mesh);
                        $('#addDeviceMenu').dialog("close");
                        container.style.cursor = "default";
                        GUI.RefreshDevices();
                    }
                }
            },
            Cancel: function () {
                $('#addDeviceMenu').dialog("close");
                container.style.cursor = "default";
            }
        }
    });
}
