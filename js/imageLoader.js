/**
 * Created by Vamsi on 3/1/2017.
 */

/*
    function to convert the floorimage to blob to load onto the canvas
 */
function imageToB64(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        };
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = "blob";
    xhr.send();
}

function addUndoImgLoad(typ, imgsrc) {
    _undo.push({'type': typ, 'imgsrc': imgsrc});
}

var callUndoRunning = 0;
function callUndoImgLoad(lastundo) {
    if (lastundo.type == "addImgLoad") {
        callUndoRunning = 1;
        loadImage(_defaultFloor.imageURL);
        callUndoRunning = 0;
    }
}

/*
    Load the image on to the canvas, uses ImagetoB64 to get the image data
 */
function loadImage(image, altitude) {

    var domURL = window.URL || window.webkitURL || window;
    var url = image;
    if (typeof image == "object") {
        var url = domURL.createObjectURL(image);
    }
    var img = new Image();
    img.src = url;
    if (callUndoRunning !== 1) {
        addUndoImgLoad("addImgLoad", '');
    }
    img.onload = function () {

        var imageWidth = img.naturalWidth, imageHeight = img.naturalHeight;
        var loader = new THREE.TextureLoader();

        _floors.clear();
        loader.load(url, function (floorTexture) {
            // Delete the default floor if still present in this config. This is done here so that index 0 is free for the first user-defined floor.
            if (_floors.floorData.length === 1 && _floors.floorData[0].isDefault) {
                _floors.removeFloor(0);
            }

            floorTexture.minFilter = THREE.LinearFilter;
            var floorMaterial = new THREE.MeshBasicMaterial({
                map: floorTexture,
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false
            });

            var floorGeometry = new THREE.PlaneBufferGeometry(imageWidth, imageHeight);
            var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
            altitude = altitude || 0;

            // Default origin is set to the bottom left corner of the floor plan.
            // Note that the origin is always world coordinates (0,0,z) and thus the default origin for a floor is (0, height).
            floorMesh.position.x = imageWidth / 2;
            floorMesh.position.y = imageHeight / 2;
            floorMesh.position.z = altitude;

            var id = 0;
            var isUniqueID = false;
            while (!isUniqueID) {
                isUniqueID = true;

                for (var i = 0; i < _floors.floorData.length; i++) {
                    if (_floors.floorData[i].id == id) {
                        id++;
                        isUniqueID = false;
                        break;
                    }
                }
            }

            floorMesh.name = "floor_" + id;

            var floor = {
                mesh: floorMesh,
                id: id,
                name: "Floor" + id,
                building_name: "",
                scale: 1,
                originXPx: 0,
                originYPx: imageHeight,
                altitude: altitude,
                building_offset_x: 0,
                building_offset_y: 0,
                building_offset_z: 0,
                imageWidthPx: imageWidth,
                imageHeightPx: imageHeight,
                gridData: undefined
            };

            imageToB64(url, function (imageData) {
                floor.imageURL = imageData;
            });

            _floors.floorData.push(floor);
            _floors.selectFloor(_floors.floorData.indexOf(floor));
        });
    };
}
