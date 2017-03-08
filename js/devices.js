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
                        refreshDevices();
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

function refreshDevices () {
    var config, temp;
    var context = document.getElementById('deviceContent');

    if (typeof localStorage !== "undefined") {
        config = localStorage.getItem("config");
    }

    if (config != null) {
        //if (config.devices != null) {
        //Create a new blob to hold the data
        temp = (new Blob([config], { type: "text/plain;charset=utf-8" }));
        var reader = new FileReader();
        //set up the file reader
        reader.onloadend = function () {
            try {
                //obtain the config through the file reader.
                config = JSON.parse(reader.result);
            }
            catch (e) {
                console.error("Could not read config file. No floors or devices will be loaded.");
                return;
            }
            //clear out the data table.
            while (context.firstChild) {
                context.removeChild(context.firstChild);
            }

            //Bind the list of devices obtained from config.
            var data = config.floors.devices;
            $("#deviceFooter").text("Total # Devices: " + _devices.deviceList.length);

            //If there are devices to update
            if (_devices.deviceList.length > 0) {
                floor = _floors.floorData[_floors.selectedFloorIndex];
                //Loop through them
                var deviceList = _devices.deviceList;

                deviceList.forEach(function (device) {
                    //Place all devices belonging to current floor..
                    if (device.mesh.floorID === _floors.selectedFloorIndex) {
                        //HTML Elements for text container
                        var textContainer = createElement('tr', 'textContainer');
                        var nameText = createElement('td', "deviceAlphaText");
                        var modelText = createElement('td', "deviceTableText");
                        var idText = createElement('td', "deviceTableText");
                        var typeText = createElement('td', "deviceTableText");
                        typeText.style.textAlign = ("center");
                        var statusText = createElement('td', "deviceTableText");

                        //Sets the device state to gray and changes the color of the status bar in the table.
                        device.STATE = DeviceState.UNKNOWN;
                        var selectCell = createElement('td');
                        var selectIcon = createElement('i', "tableIcon");
                        selectIcon.className = "fa fa-circle-thin";
                        selectCell.appendChild(selectIcon);

                        /*Error handler
                         Check user loads new file or saves
                         if user saves this file, remember the last path
                         This function takes the current config file and compares it with the current device list in memory.
                         compare local storage devices to config devices*/

                        for (var j = 0; j < data.length; j++) {
                            if (data[j].id == device.id) {
                                //Add a check later for existing device state properties
                                device.STATE = DeviceState.FOUND;
                            }
                        }


                        //Format text based on device variables
                        var devName = device.name,
                            devID = device.id,
                            devModel = device.model,//remove the white space
                            devType = device.deviceType,
                            devState = device.STATE;

                        //When you click the text, center the mesh on the screen
                        textContainer.onclick = function () {
                            //Set the target of the camera controller
                            controls.target.copy(device.mesh.position);
                            //Lerp the camera position
                            TweenLite.to(_camera.position, 1, {
                                x: device.mesh.position.x,
                                y: device.mesh.position.y,
                                z: camera.position.z
                            });

                        };
                        //Add more states/enums at the bottom of loader.js
                        //Change devType string based on device type
                        devModel = devModel.toString().replace(/\s/g, ''); //remove whitespace
                        for (var model in DeviceModel) {
                            if (devModel == DeviceModel[model]) {
                                devModel = model;
                            }
                        }

                        devType = devType.toString().replace(/\s/g, ''); //remove whitespace
                        for (var type in DeviceType) {
                            if (devType == DeviceType[type]) {
                                devType = type;
                            }
                        }

                        for (var state in DeviceState) {
                            if (devState == DeviceState[state]) {
                                typeText.classList.add(state);
                            } else {
                                typeText.classList.remove(state);
                            }
                        }

                        //Format the output string
                        statusText.textContent = devState;
                        idText.textContent = devID;
                        typeText.textContent = devType;
                        modelText.textContent = devModel;
                        nameText.textContent = devName;

                        //Here I was using spans because you cant use overflow for table data elements
                        //If we need to scroll horizontally through the table cells, this is how we do it.
                        //We can set the overflow of the span inside the table cell.


                        //textContainer.appendChild(selectCell);
                        textContainer.appendChild(nameText);
                        textContainer.appendChild(typeText);
                        textContainer.appendChild(modelText);
                        textContainer.appendChild(idText);

                        //Bind this container to the device incase we need to use it later
                        device.textContainer = textContainer;
                        // GUI.drawDevicePanel(device);
                        context.appendChild(textContainer);

                    }
                })
            }
        };
        if (temp != undefined) {
            reader.readAsText(temp);
        }
    }
}

function editDevice () {
    var dialog = $('#editDeviceMenu').dialog({
        autoOpen: false,
        resizeable: false,
        height: 350,
        width: 375,
        modal: true,
        buttons: {
            "OK": function () {
            },
            Cancel: function () {
                $('#editDeviceMenu').dialog("close");
            }
        }
    });
}
