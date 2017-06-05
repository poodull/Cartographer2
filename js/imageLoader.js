/**
 * Created by Vamsi on 3/1/2017.
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

function addUndoImgLoad(typ , imgsrc ){
    _undo.push({'type' : typ , 'imgsrc' : imgsrc});
}

function callUndoImgLoad(lastundo){
    if(lastundo.type == "addImgLoad" ){
        loadImage(_defaultFloor.imageURL);

    }
}


// if( typeof _floors.floorData[0] !== "undefined"  && typeof _floors.floorData[0].mesh !== "undefined" && typeof _floors.floorData[0].mesh.material.map.image.currentSrc !== "undefined"){
//     addUndoImgLoad("addImgLoad" , _floors.floorData[0].mesh.material.map.image.currentSrc );
// }else{
//     addUndoImgLoad("addImgLoad" , '' );
// }


function loadImage(image, altitude) {

    var domURL = window.URL || window.webkitURL || window;
    var url = domURL.createObjectURL(image);
    var img = new Image();
    img.src = url;
    img.onload = function () {

        var imageWidth = img.naturalWidth, imageHeight = img.naturalHeight;
        var loader = new THREE.TextureLoader();
        addUndoImgLoad("addImgLoad" , '' );

        _floors.clear();
        loader.load(url, function (floorTexture) {
            // Delete the default floor if still present in this config. This is done here so that index 0 is free for the first user-defined floor.
            if (_floors.floorData.length === 1 && _floors.floorData[0].isDefault) {
                console.log("Deleting default floor.");
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
