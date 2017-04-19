/**
 * Created by Vamsi on 2/28/2017.
 */
var _floors = new Floors();

function loadDefaultFloor() {
    var domURL = window.URL || window.webkitURL || window;

    async.waterfall([
        function (callback1) {
            getMeta(_defaultFloor, domURL, callback1);
        },
        function (url, floorData, width, height, callback2) {
            loadFloor(url, floorData, width, height, callback2);
        }
    ], function () {    // Called after the last function in the waterfall calls its callback (callback2).
        if (_floors.floorData.length > 0) {
            _floors.selectFloor(0);
            _floors.floorData[_floors.selectedFloorIndex].isDefault = true;
        }
    });
}

function getMeta(floorData, domURL, callback) {
    var blob;

    if (typeof floorData.imageURL !== "undefined")
        blob = b64toBlob(floorData.imageURL);
    else if (typeof floorData.image !== "undefined")
        blob = b64toBlob(floorData.image);

    var url = domURL.createObjectURL(blob);
    var img = new Image();
    img.src = url;

    // First parameter of callback is null for async.waterfall. Use a non-null value to pass and error report to async.waterfall.
    img.onload = function () {
        callback(null, url, floorData, this.naturalWidth, this.naturalHeight)
    };
}

function loadFloor(url, floorData, imageWidth, imageHeight, callback) {

    var loader = new THREE.TextureLoader();

    loader.load(url, function (floorTexture) {
        floorTexture.minFilter = THREE.LinearFilter;
        var floorMaterial = new THREE.MeshBasicMaterial({
            map: floorTexture,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false
        });
        var floorGeometry = new THREE.PlaneBufferGeometry(imageWidth, imageHeight);
        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.name = "floor_" + floorData.name;

        var originXPx = 0, originYPx = imageHeight;

        if (typeof floorData.originXPx !== "undefined")
            originXPx = floorData.originXPx;
        else if (floorData.origin_x !== "undefined")
            originXPx = floorData.origin_x;

        if (typeof floorData.originYPx !== "undefined")
            originYPx = floorData.originYPx;
        else if (typeof floorData.origin_y !== "undefined")
            originYPx = floorData.origin_y;

        var centerXu = imageWidth / 2;
        var centerYu = imageHeight / 2;

        floorMesh.position.x = (floorData.building_offset_x || 0) + centerXu - originXPx;
        floorMesh.position.y = (floorData.building_offset_y || 0) - centerYu + originYPx;
        floorMesh.position.z = (floorData.building_offset_z || 0) + floorData.altitude;

        var emptyGirdData = {
            'polys': [],
            'devices': [],
            'plane': plane,
            'cubeSize': _cubeSize
        };

        var floor = {
            mesh: floorMesh,
            imageURL: floorData.imageURL,
            id: floorData.floor_id || floorData.id, // floor_id is used as a field instead of id in the Floor DB table.
            name: floorData.name,
            building_name: floorData.building_name,
            scale: floorData.scale,
            originXPx: originXPx,
            originYPx: originYPx,
            altitude: floorData.altitude,
            building_offset_x: floorData.building_offset_x || 0,
            building_offset_y: floorData.building_offset_y || 0,
            building_offset_z: floorData.building_offset_z || 0,
            //these are not part of the database
            imageWidthPx: imageWidth,
            imageHeightPx: imageHeight,//these are not part of the database
            //width: imageWidth / floorData.scale, // <-- This is unnecessary since the data is already in the structure
            gridData: emptyGirdData //filled in by grid constuctor
        };

        if (typeof floorData.walls !== "undefined") {
            floor.savedAreas = floorData.walls; // List of polys on this floor saved to the config file.
            // initGrid should read these values to create poly objects when it is first called for a floor.
        }

        _floors.floorData.push(floor);
        callback(null); // First parameter of callback is null for async.waterfall. Use a non-null value to pass an error report to async.waterfall.
    });
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || 'data:image/png';
    sliceSize = sliceSize || 512;

    if (b64Data.startsWith('data:image')) {
        contentType = b64Data.substr(0, b64Data.indexOf(';'));
        b64Data = b64Data.substr(b64Data.indexOf(',') + 1);
    }

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

function loadConfig(file, newFile) {
    // TODO: clear any floor
    if (typeof _floors !== "undefined" && typeof _floors.floorData !== "undefined") {
        _floors.floorData.forEach(function (floor) {
            if (typeof floor.gridData !== "undefined") {
                scene.remove(floor.gridData.plane);
            }
        });
    }

    _floors.clear();
    _devices.clear();
    var config, democonfig = [];

    var reader = new FileReader();
    reader.onloadend = function () {
        var domURL = window.URL || window.webkitURL || window;

        try {
            config = JSON.parse(reader.result);
        } catch (e) {
            console.error("Could not read config file. No floors or devices will be loaded.");
            return;
        }

        if (!Array.isArray(config.floors)) {
            democonfig.push(config.floors);
            config.floors = democonfig;
        }

        async.eachSeries(config.floors, function (floor, onSingleFloorLoaded) {
            async.waterfall([
                function (callback1) {
                    getMeta(floor, domURL, callback1);
                },
                function (url, floorData, width, height, callback2) {
                    loadFloor(url, floorData, width, height, callback2);
                }
            ], function () {    // Called after the last function in the waterfall calls its callback (callback2).
                onSingleFloorLoaded();  // Tells async.eachSeries that this iteration using config.floors[i] is done.
            });
        }, function () {
            // Load devices.
            if (newFile || file == null) {
                console.log(config);
            } else {
                if ((typeof config.devices === "undefined" || !Array.isArray(config.devices) ) && 1 && config.floors[0]) {
                    config.devices = config.floors[0].devices;
                }
                if (config.devices) {
                    for (var i = 0; i < config.devices.length; i++) {
                        var data = config.devices[i];

                        var device = {
                            id: data.id,
                            name: data.name,
                            model: data.model,
                            deviceType: data.deviceType
                        };

                        var floor = _floors.floorData.find(function (element) {
                            return element.id == data.floorID
                        });
                        loadDevice(device, data.x * floor.scale, data.y * floor.scale, data.floorID);
                    }
                }
                if (_floors.floorData.length > 0) {
                    _floors.selectFloor(0);
                    saveConfig(true);
                } else {  // If no floors found in the config, load the default floor.
                    loadDefaultFloor();
                }

                if (config.floors[0] && typeof config.floors[0].walls !== "undefined") {
                    loadWalls(config.floors[0].walls);
                }
            }
        });
    };

    if (file instanceof Blob) {
        reader.readAsText(file);
    } else {
        loadDefaultFloor();
    }
}

function saveConfig(newConfigFlag) {
    var floors = [], devices = [], txIcons = [], db = [];

    _floors.floorData.forEach(function (entry) {
        var floor = {
            id: entry.id,
            imageURL: entry.imageURL,
            name: entry.name,
            building_name: entry.building_name,
            scale: entry.scale,
            originXPx: entry.originXPx,
            originYPx: entry.originYPx,
            altitude: entry.altitude,
            imageWidthPx: entry.imageWidthPx,
            imageHeightPx: entry.imageHeightPx
        };

        // Save polys, also known as "walls".
        if (1 || typeof entry.savedAreas == "undefined") {
            var walls = new Array();

            if (typeof entry.gridData !== "undefined" && typeof entry.gridData.polys !== "undefined") {
                entry.gridData.polys.forEach(function (poly) {
                    var points = new Array();
                    poly.cubes.forEach(function (cube) {
                        points.push(cube.position);
                    });
                    walls.push({ points: points, color: poly.color });
                });
            }
            floor.walls = walls;
        } else {
            floor.walls = entry.savedAreas; // Floor's poly list from the config were never loaded because the floor was not ever selected.
            // So, preserve the poly config for this unselected floor and save it back to the new config file.
        }
        changes = 1;
        floors.push(floor);
    });

    _devices.deviceList.forEach(function (entry) {
        var device = {
            id: entry.id,
            name: entry.name,
            model: entry.model,
            deviceType: entry.deviceType
        };

        var mesh = _devices.meshList.find(function (element) {
            return element.deviceID == device.id;
        });

        var floor = _floors.floorData.find(function (element) {
            return element.id == mesh.floorID
        });

        // Save device coordinates in units instead of the mesh's physical location.
        device.x = mesh.position.x / floor.scale;
        device.y = mesh.position.y / floor.scale;
        device.z = mesh.position.z;
        device.floorID = mesh.floorID;

        devices.push(device);
    });
    if (floors.length) {
        floors = floors[0];
        floors.devices = devices;
    }

    var json = JSON.stringify({
        unit: "meters",
        floors: floors
    }, null, '\t');
    var blob = new Blob([json], { type: "text/plain;charset=utf-8" });
    if (!newConfigFlag) {
        saveAs(blob, "config.txt");
    }
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("config", json);
    }
    refreshDevices();

}

function loadDevice(device, x, y, floorID) {
    if (typeof lastTouchPoint !== "function") {
        return false;
    }

    var material = new THREE.MeshLambertMaterial({
        color: "green",
        depthWrite: true
    });
    var geometry;

    if (device.deviceType == DeviceType.RECEIVER)
        geometry = new THREE.CylinderGeometry(1, 1, 2, 16);
    else if (device.deviceType == DeviceType.SENSOR)
        geometry = new THREE.CylinderGeometry(0, 1, 2, 4, 4);
    else
        geometry = new THREE.CubeGeometry(2, 2, 2);

    var deviceMesh = new THREE.Mesh(geometry, material);

    deviceMesh.position.x = x;
    deviceMesh.position.y = y;
    deviceMesh.position.z = 0; // Floor altitude + height of mesh.
    deviceMesh.deviceID = device.id;
    deviceMesh.floorID = floorID;
    deviceMesh.name = "device_" + device.id;
    device.mesh = deviceMesh;

    if (device.deviceType == DeviceType.RECEIVER)
        deviceMesh.rotation.x = Math.PI / 2;
    else if (device.deviceType == DeviceType.SENSOR)
        deviceMesh.rotation.x = Math.PI * .5;

    // Displays edges without drawing diagonals.
    var edges = new THREE.EdgesHelper(deviceMesh, 0xffffff);
    edges.material.linewidth = 2;
    deviceMesh.edges = edges;

    _devices.deviceList.push(device);
    _devices.meshList.push(deviceMesh);

    var outlineMaterial = new THREE.MeshPhongMaterial({ color: "yellow", side: THREE.BackSide });
    var deviceOutline = new THREE.Mesh(geometry, outlineMaterial);

    deviceOutline.position.copy(deviceMesh.position);
    deviceOutline.rotation.copy(deviceMesh.rotation);
    deviceMesh.deviceOutline = deviceOutline;
}

function Floors() {
    this.floorData = [];    //floor_id, name, building_name, scale, origin_x, origin_y, altitude, building_offset_x, building_offset_y, building_offset_z
    this._selectedFloorIndex = -1;
    Object.defineProperties(this, {
        "selectedFloorIndex": {
            "get": function () {
                return this._selectedFloorIndex;
            }
        }
    });

    this.selectFloor = function (index) {
        if (this.floorData.length >= index && this._selectedFloorIndex !== index) {
            // Preserve current camera distance from floor when switching floors.
            var cameraDistance = new THREE.Vector3(), targetOffset = new THREE.Vector3();
            _devices.visibleDevices = [];

            if (this._selectedFloorIndex !== undefined && this._selectedFloorIndex > -1) {
                //remove previous floor
                var lastFloor = this.floorData[this._selectedFloorIndex];

                // Preserve last camera position and orbit controls target.
                cameraDistance.x = camera.position.x - lastFloor.mesh.position.x;
                cameraDistance.y = camera.position.y - lastFloor.mesh.position.y;
                cameraDistance.z = camera.position.z - lastFloor.mesh.position.z;
                targetOffset.x = controls.target.x - lastFloor.mesh.position.x;
                targetOffset.y = controls.target.y - lastFloor.mesh.position.y;
                targetOffset.z = controls.target.z - lastFloor.mesh.position.z;
                // Fade previous floor.
                TweenLite.to(lastFloor.mesh.material, 1,
                    {
                        opacity: 0,
                        onComplete: function () {
                            for (var i = 0; i < _devices.meshList.length; i++) {
                                if (_devices.meshList[i].floorID == lastFloor.id) {
                                    scene.remove(_devices.meshList[i]);
                                    scene.remove(_devices.meshList[i].edges);
                                }
                            }

                            scene.remove(lastFloor.mesh);
                        }
                    });
            }

            this._selectedFloorIndex = index;
            scene.add(this.floorData[index].mesh);
            var selectedFloor = this.floorData[index];

            this.floorData[index].mesh.material.opacity = 0;
            TweenLite.to(selectedFloor.mesh.material, 1,
                {
                    opacity: 1,
                    onComplete: function () {
                        var device;

                        // Show devices on this floor after the fade-in floor animation is done.
                        for (var i = 0; i < _devices.meshList.length; i++) {
                            device = _devices.meshList[i];

                            if (device.floorID == selectedFloor.id) {
                                device.scale.setLength(10);//(selectedFloor.scale / 10)
                                device.deviceOutline.scale.setLength(12);//(selectedFloor.scale / 8);
                                scene.add(device);
                                scene.add(device.edges);
                                _devices.visibleDevices.push(device);
                            }
                        }
                        drawAxesHelper(100 / selectedFloor.scale, selectedFloor.mesh.position.z);
                    }
                });

            // Move to camera position over selected floor using tween.
            if (cameraDistance.z == 0) {
                cameraDistance.z = selectedFloor.imageWidthPx * 2;
            }

            // Maintain the camera's position. Zoom and tilt (orbit around the camera control target) changes the camera's position.
            TweenLite.to(camera.position, 1, {
                x: selectedFloor.mesh.position.x + cameraDistance.x,
                y: selectedFloor.mesh.position.y + cameraDistance.y,
                z: selectedFloor.mesh.position.z + cameraDistance.z
            });

            // Maintain the target of the camera orbit controls (relative to the center of the image). Pan changes the target.
            TweenLite.to(controls.target, 1, {
                x: selectedFloor.mesh.position.x + targetOffset.x,
                y: selectedFloor.mesh.position.y + targetOffset.y
            });

            var altitude = { value: 0 };
            TweenLite.to(altitude, 1, {
                value: selectedFloor.mesh.position.z, onUpdate: function () {
                    _targetZ = altitude.value;
                }
            });
        }
    };

    var onSelectedFloorChanged = document.createEvent("CustomEvent");
    onSelectedFloorChanged.initCustomEvent("onSelectedFloorChanged", false, false, { "index": this._selectedFloorIndex });

    this.clear = function () {
        this.floorData.forEach(function (floor) {
            removeWall(floor);
            scene.remove(floor.mesh);
        });
        this.floorData.length = 0;
        this._selectedFloorIndex = -1;
    };
}

var DeviceType =
    {
        RECEIVER: 5,
        SENSOR: 8
    };

