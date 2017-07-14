/**
 * Created by Vamsi on 3/3/2017.
 */

var _drawMode = new drawMode();
var ControlModes = {
    Orbit: 'camera',
    SetScale: 'setScale',
    SetOrigin: 'setOrigin',
    DeviceManager: 'deviceManager',
    PlaceDevice: 'placeDevice',
    AddDevice: 'addDevice',
    MoveDevice: 'moveDevice',
    DrawPoly: 'drawPoly',
    CutPoly: 'cutPoly',
    DrawContinuePoly: 'DrawContinuePoly',
    'Select': 'select',
    PanSelect: 'panSelect'
};
var _tempScaleCube = [], selectDrawBox = false;
var _tempScaleLine, _tempSelectLine, _tempSelectCubes = [], _undo = [];

function initDrawLine() {
    initCursorVoxel(_cubeSize);
    createPlane();
}

/*
 function to initiate the cursor voxel
 uses three js mesh object
 */
function initCursorVoxel(cursorSize) {
    _cursorVoxel = new THREE.Mesh(new THREE.CubeGeometry(cursorSize, cursorSize, cursorSize), new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: .5,
        side: THREE.DoubleSide,
        color: "silver",
        depthWrite: true
    }));
}

/*
 function to stop drawing wall on press of escape or end of a single wall
 call redrawline if in continous mode
 */
function stopDrawWall() {
    if (_tempCubes.length < 2) {
        scene.remove(_tempCubes[0]);
    }

    if (_drawMode.mode == ControlModes.DrawContinuePoly) {
        _drawMode.selectedObject = undefined;
        redrawLine();
    } else {
        $.each(_tempCubes, function (i, cube) {
            scene.remove(cube);
        });
        scene.remove(_tempLine);
        scene.remove(_cursorVoxel);
    }
    _tempCubes = [];
    continueLinePoly = undefined;
    _tempLine = undefined;
}

/*
 function to remove the select box
 */
function removeSelectWallBox() {
    scene.remove(_tempSelectLine);
    scene.remove(_cursorVoxel);

    $.each(_tempSelectCubes, function (i, cube) {
        scene.remove(cube);
    });

    _tempSelectCubes = [];
    _tempSelectLine = undefined;
}

function removeWall(floor) {
    if (floor.gridData && floor.gridData.polys.length < 1)return false;

    if (floor.gridData) {
        $.each(floor.gridData.polys, function (i, poly) {
            scene.remove(poly.line);
            $.each(poly.cubes, function (j, cube) {
                scene.remove(cube);
            })
        });
        floor.gridData.polys = [];
    }


    $.each(_tempCubes, function (i, cube) {
        scene.remove(cube);
    });

    scene.remove(_tempLine);
    scene.remove(_cursorVoxel);

    _tempCubes = [];
    _tempLine = undefined;
}

function cutSelectedWall(topoly, cutPoint) {
    var polys = _floors.floorData[0].gridData.polys, toCutWall,
        cutVoxel = createVoxelAt(cutPoint, "red");


    $.each(polys, function (i, poly) {
        if (topoly.name === poly.line.name) {
            poly.cutPoint = cutVoxel;
            addUndoLine("cutPoly", poly);
            toCutWall = poly;
            scene.remove(poly.line);
            _tempCubes = [];
            $.each(poly.cubes, function (j, cube) {
                _tempCubes.push(cube);

                if (j === (poly.cubes.length - 1)) {
                    _drawMode.selectedObject = undefined;
                    redrawLine();
                    commitPoly();
                    var index = polys.indexOf(poly);
                    polys.splice(index, 1);
                    return false;
                }
                var nextpoint = poly.cubes[j + 1],
                    diff = (cutPoint.x - cube.position.x) * (cutPoint.y - nextpoint.position.y) - (cutPoint.x - nextpoint.position.x) * (cutPoint.y - cube.position.y);
                if (diff < 3 && diff > -3) {
                    scene.add(cutVoxel);
                    _tempCubes.push(cutVoxel);
                    _drawMode.selectedObject = undefined;
                    redrawLine();
                    commitPoly();
                    _tempCubes = [];
                    scene.add(cutVoxel);
                    _tempCubes.push(cutVoxel);
                }
            })
        }
    });
}

var drawModeRun = false, mouseDownDraw = !1, panMove, selectedDevice;
function onDocumentMouseDownDraw(event) {
    if (event.button == 0) {
        event.preventDefault();
        lastMouseClick = getTouchPoint(event.clientX, event.clientY);
        _drawMode.mouseX = ((event.clientX - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
        _drawMode.mouseY = -((event.clientY - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);

        switch (_drawMode.mode) {
            case ControlModes.PanSelect:
                var intersects = raycaster.intersectObjects([plane], true);
                panMove = intersects[0];
                mouseDownDraw = !0;
                break;

            case ControlModes.DrawPoly:
                showWallInf = !0;
                var intersects = raycaster.intersectObjects(_allCubes.concat((_tempCubes.concat([plane]))), true);
                _drawMode.selectedObject = intersects[0];
                var voxel = createVoxelAt(_drawMode.selectedObject.point, CubeColors.properties[_currentPen].hex);
                scene.add(voxel);
                _tempCubes.push(voxel);

                if (drawModeRun == true) {
                    showWallInf = !1;
                    drawModeRun = false;
                    redrawLine();
                    var singlePoly = commitPoly();
                    addUndoLine("createSinglePoly", singlePoly);

                    return false;
                }
                drawModeRun = true;
                break;

            case ControlModes.DrawContinuePoly:
                showWallInf = !0;
                var intersects = raycaster.intersectObjects(_allCubes.concat((_tempCubes.concat([plane]))), true);
                _drawMode.selectedObject = intersects[0];
                var voxel = createVoxelAt(_drawMode.selectedObject.point, CubeColors.properties[_currentPen].hex);
                scene.add(voxel);
                _tempCubes.push(voxel);

                if (_tempCubes.length > 1) {
                    var contPoly = commitPoly();
                    if (_tempCubes.length == 2) {
                        addUndoLine("startContPoly", $.extend(true, {}, contPoly));
                    }
                    addUndoLine("createContPoly", $.extend(true, {}, contPoly));
                }
                redrawLine();
                break;

            case ControlModes.CutPoly:
                var polys = _floors.floorData[0].gridData.polys, polyline = [];

                $.each(polys, function (i, poly) {
                    polyline.push(poly.line);
                });
                var intersects = raycaster.intersectObjects(polyline, true);
                if (intersects.length) {
                    cutSelectedWall(intersects[0].object, intersects[0].point);
                }
                break;

            case ControlModes.Select:
                showWallInf = !0;
                selectWallFunc();
                if (typeof singleSelectWall !== "undefined") {
                    removeSelectWallBox();
                    mouseDownDraw = !0;
                    removeSelectWallBox();
                    selectDrawBox = false;
                    if (singleSelectWall.cubes.length > 0) {
                        if (typeof selectedPolys !== "undefined" && selectedPolys.length > 1) {
                            addUndoEditPoly(selectedPolys);
                        } else {
                            addUndoEditPoly([singleSelectWall]);
                        }
                    }
                    return false;
                }
                if (selectDrawBox) {
                    removeSelectWallBox();
                    selectDrawBox = false;
                } else {
                    initCursorVoxel(_cubeSize);
                }

                var intersects = raycaster.intersectObjects(_allCubes.concat((_tempSelectCubes.concat([plane]))), true);
                _drawMode.selectedObject = intersects[0];
                var voxel = createVoxelAt(_drawMode.selectedObject.point, "silver");
                scene.add(voxel);
                _tempSelectCubes.push(voxel);
                break;

            case ControlModes.MoveDevice:
                var intersects = raycaster.intersectObjects(_devices.meshList.concat(plane), true);
                if (intersects[0].object.name.startsWith("device_")) {
                    _selectedDragDevice = intersects[0].object;
                    var obj = {
                        'device': $.extend(true, {}, intersects[0].object),
                        'position': $.extend(true, {}, intersects[0].object.position)
                    };
                    addUndoDevice('moveDevice', obj);
                }
                break;

            case ControlModes.SetOrigin:
                var intersects = raycaster.intersectObject(plane, true);
                if (intersects.length > 0) {
                    setNewOrigin(intersects);
                }
                break;

            case ControlModes.SetScale:
                initCursorVoxel(_cubeSize);
                var intersects = raycaster.intersectObjects(_allCubes.concat((_tempCubes.concat([plane]))), true);
                _drawMode.selectedObject = intersects[0];
                var voxel = createVoxelAt(_drawMode.selectedObject.point, 'silver');
                scene.add(voxel);
                _tempScaleCube.push(voxel);
                break;
            default:
                break;
        }
    }
}

/*

 */
function addUndoEditPoly(selectWall) {
    var newObj = [];
    if (selectWall.length) {
        $.each(selectWall, function (j, singleSelectWall) {
            newObj[j] = {};
            $.each(singleSelectWall, function (name, val) {
                if (typeof val == "object" && "cubes" == name) {
                    if (val.length) {
                        newObj[j][name] = [];
                        $.each(val, function (i, v) {
                            if ("function" == typeof v.clone) {
                                var cube = v.clone();
                                newObj[j][name].push(cube);
                            }
                        });
                    }
                } else {
                    newObj[j][name] = val;
                }
            });
        });
        addUndoLine("editPoly", newObj);
    }
}

function hidPolyInfo() {
    $("div[id^=showWallPos_]").remove();
}

var matchPolyIndex;
/*
 function to define all the undo actions

 */
function callUndo() {
    continueLinePoly = undefined;
    showWallInf = false;
    hidPolyInfo();

    var lastUndo = _undo.pop();
    var polys = [], matchPoly;
    if (typeof _floors.floorData[_floors.selectedFloorIndex].gridData !== "undefined") {
        polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    }

    if (typeof lastUndo !== "undefined" && (lastUndo.type == "addImgLoad")) {
        callUndoImgLoad(lastUndo);
    } else if (typeof lastUndo !== "undefined" && ((lastUndo.type == "addDevice") || (lastUndo.type == "deleteDevice") || (lastUndo.type == "moveDevice" ))) {
        callUndoDevices(lastUndo);

    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "addOrigin") {
        callUndoOriginFunc(lastUndo.intersects);
    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "addScale") {
        callUndoScale(lastUndo.scale);
    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "cutPoly") {
        var rmindex = [];
        $.each(polys, function (i, poly) {
            $.each(poly.cubes, function (j, cube) {
                if (lastUndo.polys.cutPoint.position === cube.position) {
                    $.each(poly.cubes, function (k, rcube) {
                        scene.remove(rcube);
                    });
                    scene.remove(poly.line);
                    var index = polys.indexOf(poly);
                    rmindex.push(index);
                    return false;
                }
            });
        });
        rmindex.reverse();
        $.each(rmindex, function (i, index) {
            if (typeof polys[index] !== "undefined") {
                polys.splice(index, 1);
            }
        });
        createPolyUndo([lastUndo.polys]);

    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "editPoly") {

        if (lastUndo.polys.length > 0) {
            $.each(lastUndo.polys, function (k, lastundoPoly) {
                $.each(polys, function (i, poly) {
                    if (poly.polyId == lastundoPoly.polyId) {
                        matchPoly = poly;
                        matchPolyIndex = polys.indexOf(poly);
                    }
                });
                if (typeof matchPoly !== "undefined") {
                    callPolyUndo(lastundoPoly, lastUndo.type);
                }
            });
        }

    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "startContPoly") {
        $.each(polys, function (i, poly) {
            if (poly.polyId == lastUndo.polys.polyId) {
                matchPolyIndex = polys.indexOf(poly);
                scene.remove(poly.line);
                $.each(poly.cubes, function (i, cube) {
                    scene.remove(cube);
                });
            }
        });
        polys.splice(matchPolyIndex, 1);
        saveConfig(true);
    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "createContPoly") {
        if (typeof lastUndo.polys !== "undefined") {
            $.each(polys, function (i, poly) {
                if (poly.polyId == lastUndo.polys.polyId) {
                    matchPoly = poly;
                    matchPolyIndex = polys.indexOf(poly);
                    if (poly.cubes.length == lastUndo.polys.cubes.length) {
                        //check if last elemnt is createcontpoly
                        lastUndo = _undo.pop();
                    }
                }
            });
            if (typeof matchPoly !== "undefined") {
                callPolyUndo(lastUndo.polys, lastUndo.type);
            }
        }
    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "createSinglePoly") {
        if (typeof lastUndo.polys !== "undefined") {
            var index = polys.indexOf(lastUndo.polys);
            if (index >= 0) {
                removePolyUndo([polys[index]]);
            }
        }
    } else if (typeof lastUndo !== "undefined" && lastUndo.type == "removepoly") {
        createPolyUndo(lastUndo.polys);
    }
}

/*
 function to undo drawn poly
 */
function callPolyUndo(lastpoly, lastUndotype) {
    if (lastpoly.polyId) {
        var remPolys = [], polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
        $.each(polys, function (i, poly) {
            if (poly.polyId == lastpoly.polyId) {
                scene.remove(poly.line);
                $.each(poly.cubes, function (i, cube) {
                    scene.remove(cube);
                });
            }
        });
        if (lastpoly.cubes.length < 2 && lastUndotype == "createContPoly") {
            polys.splice(matchPolyIndex, 1);
        } else {
            createPolyUndo([lastpoly]);
        }
    }
}

function createPolyUndo(lastUndoPolys) {
    if (lastUndoPolys.length) {
        $.each(lastUndoPolys, function (i, poly) {
            $.each(poly.cubes, function (j, cube) {
                cube.material.color = new THREE.Color('red');
                _tempCubes.push(cube);
                scene.add(cube);
            });

            var tmpDrawMode = _drawMode.mode;
            _drawMode.mode = undefined;
            _drawMode.selectedObject = undefined;
            redrawLine();

            _drawMode.mode = ControlModes.DrawContinuePoly;
            if (typeof matchPolyIndex !== "undefined") {
                commitPoly(matchPolyIndex)
            } else {
                commitPoly();
            }
            _drawMode.mode = tmpDrawMode;

            _tempLine = undefined, _tempCubes = [];
        });
    }
}

function addUndoLine(typ, polys) {
    _undo.push({'type': typ, polys});
}

function removePolyUndo(selectedPolys) {
    var remPolys = [], polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    if (selectedPolys.length) {
        $.each(selectedPolys, function (i, poly) {
            var index = polys.indexOf(poly);
            scene.remove(poly.line);
            $.each(poly.cubes, function (i, cube) {
                scene.remove(cube);
            });

            polys.splice(index, 1);
        });

        saveConfig(true);
        return false;
    }
}

function removeSelectedPoly() {
    var remPolys = [], polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;

    if (selectedPolys.length) {
        addUndoLine("removepoly", selectedPolys);
        $.each(selectedPolys, function (i, poly) {
            var index = polys.indexOf(poly);
            scene.remove(poly.line);
            $.each(poly.cubes, function (i, cube) {
                scene.remove(cube);
            });

            polys.splice(index, 1);
        });

        saveConfig(true);
        return false;
    }
    /* single select wall remove */
    if (typeof singleSelectWall !== "undefined") {
        scene.remove(singleSelectWall.line);
        $.each(singleSelectWall.cubes, function (i, cube) {
            scene.remove(cube);
        });
        remPolys.push(singleSelectWall);
    } else {
        /* multi select wall remove */
        if (_tempSelectCubes.length !== 2)return false;

        var tpLeft, btRight, z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
        if (_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y) {
            tpLeft = _tempSelectCubes[1].position;
            btRight = _tempSelectCubes[0].position;
        } else if (_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y) {
            tpLeft = _tempSelectCubes[0].position;
            btRight = _tempSelectCubes[1].position;
        } else if (_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y) {

            tpLeft = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);
            btRight = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
        } else if (_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y) {

            tpLeft = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
            btRight = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);

        }

        for (var i = 0; i < polys.length; i++) {
            var inP = false;
            for (var j = 0; j < polys[i].cubes.length; j++) {
                var cube = polys[i].cubes[j];
                inP = checkBound(cube.position, tpLeft, btRight);
                if (inP === false)break;
            }

            if (inP == true) {
                scene.remove(polys[i].line);
                $.each(polys[i].cubes, function (i, cube) {
                    scene.remove(cube);
                });
                remPolys.push(polys[i]);
            }
        }
    }

    $.each(remPolys, function (i, poly) {
        var index = polys.indexOf(poly);
        polys.splice(index, 1);
    });

    saveConfig(true);
    removeSelectWallBox();
}

var selectedPolys = [];
function showSelectedPoly() {
    selectedPolys = [];
    /* single select wall remove */
    var remPolys = [], polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    if (typeof singleSelectWall !== "undefined") {
        scene.remove(singleSelectWall.line);
        $.each(singleSelectWall.cubes, function (i, cube) {
            scene.remove(cube);
        });
        remPolys.push(singleSelectWall);
    } else {
        /* multi select wall remove */
        if (_tempSelectCubes.length !== 2)return false;

        var tpLeft, btRight, z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
        if (_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y) {
            tpLeft = _tempSelectCubes[1].position;
            btRight = _tempSelectCubes[0].position;
        } else if (_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y) {
            tpLeft = _tempSelectCubes[0].position;
            btRight = _tempSelectCubes[1].position;
        } else if (_tempSelectCubes[0].position.x > _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y < _tempSelectCubes[1].position.y) {

            tpLeft = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);
            btRight = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
        } else if (_tempSelectCubes[0].position.x < _tempSelectCubes[1].position.x
            && _tempSelectCubes[0].position.y > _tempSelectCubes[1].position.y) {

            tpLeft = snapXYZ(_tempSelectCubes[0].position.x, _tempSelectCubes[1].position.y, z, _cubeSize);
            btRight = snapXYZ(_tempSelectCubes[1].position.x, _tempSelectCubes[0].position.y, z, _cubeSize);

        }

        for (var i = 0; i < polys.length; i++) {
            var inP = false;
            for (var j = 0; j < polys[i].cubes.length; j++) {
                var cube = polys[i].cubes[j];
                inP = checkBound(cube.position, tpLeft, btRight);
                if (inP === false)break;
            }

            if (inP == true) {
                polys[i].line.material.color = new THREE.Color('silver');
                //scene.remove(polys[i].line);
                $.each(polys[i].cubes, function (i, cube) {
                    cube.material.color = new THREE.Color('silver');
                    //scene.remove(cube);
                });
                selectedPolys.push(polys[i]);
            }
        }
    }


    $.each(selectedPolys, function (i, poly) {
        var index = polys.indexOf(poly);
        //polys.splice(index,1);
    });

    saveConfig(true);
    removeSelectWallBox();
}


function checkWithinLine(point, firstpoint, secondPoint) {

    var tpLeft, btRight, z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    if (firstpoint.position.x > secondPoint.position.x
        && firstpoint.position.y > secondPoint.position.y) {
        tpLeft = secondPoint.position;
        btRight = firstpoint.position;
    } else if (firstpoint.position.x < secondPoint.position.x
        && firstpoint.position.y < secondPoint.position.y) {
        tpLeft = firstpoint.position;
        btRight = secondPoint.position;
    } else if (firstpoint.position.x > secondPoint.position.x
        && firstpoint.position.y < secondPoint.position.y) {

        tpLeft = snapXYZ(secondPoint.position.x, firstpoint.position.y, z, _cubeSize);
        btRight = snapXYZ(firstpoint.position.x, secondPoint.position.y, z, _cubeSize);
    } else if (firstpoint.position.x < secondPoint.position.x
        && firstpoint.position.y > secondPoint.position.y) {

        tpLeft = snapXYZ(firstpoint.position.x, secondPoint.position.y, z, _cubeSize);
        btRight = snapXYZ(secondPoint.position.x, firstpoint.position.y, z, _cubeSize);
    }

    return checkBound(point, tpLeft, btRight);

}

function checkBound(point, tpLeft, btRight) {
    if (tpLeft.x <= point.x && point.x <= btRight.x && tpLeft.y <= point.y && point.y <= btRight.y) {
        return true;
    }
    return false;
}

function findPoly(id) {
    var polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
    for (var i = 0; i < polys.length; i++) {
        if (polys[i].line.id === id) {
            return polys[i];
        }
    }
    return undefined;
}

function moveLine(polyline) {
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver", linewidth: 1});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor

    var endPoint, firstPoint;
    for (var i = 0; i < _tempCubes.length; i++) {
        endPoint = snapPoint(_tempCubes[i].position, _cubeSize);
        geometry.vertices.push(endPoint);
        firstPoint = firstPoint || endPoint;
    }

    if (_tempCubes.length > 0) {
        material.color = _tempCubes[0].material.color;
    }

    polyline.geometry = geometry;
    polyline.material = material;
    _tempLine = polyline;
}

function redrawLine() {
    if (_tempCubes.length < 1) {
        return false;
    }

    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver", linewidth: 1});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var endPoint, firstPoint;

    for (var i = 0; i < _tempCubes.length; i++) {
        if (typeof endPoint !== "undefined") {
            firstPoint = endPoint;
        }
        endPoint = snapPoint(_tempCubes[i].position, _cubeSize);
        geometry.vertices.push(endPoint);
        firstPoint = firstPoint || endPoint;
    }

    if (typeof _drawMode.selectedObject !== "undefined") {
        if (typeof endPoint !== "undefined") {
            firstPoint = endPoint;
        }
        endPoint = snapXYZ(_drawMode.selectedObject.point.x, _drawMode.selectedObject.point.y, z, _cubeSize);
        geometry.vertices.push(endPoint);
    }

    if (_tempCubes.length > 0) {
        material.color = _tempCubes[0].material.color;
    }


    if (_drawMode.mode == ControlModes.DrawContinuePoly && typeof continueLinePoly !== "undefined") {
        _tempLine = continueLinePoly.line;
        _tempLine.geometry = geometry;
        _tempLine.material = material;
    } else {
        if (_tempLine !== undefined) {
            scene.remove(_tempLine);
        }

        _tempLine = new THREE.Line(geometry, material);
        _tempLine.name = "tempLine_" + ((new Date).getMilliseconds());
        scene.add(_tempLine);
    }
    if (showWallInf) {
        wallInfoCalc(firstPoint, endPoint, "show");
    } else {
        $("div[id^=showWallPos_]").remove();
    }
}

/*
    function to calculate wall length
 */
var showWallInf = false;
function wallInfoCalc(firstPoint, endPoint, wallPointId) {
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var floorScale = _floors.floorData[_floors.selectedFloorIndex].scale;
    var dist = Math.sqrt(Math.pow((endPoint.x / floorScale - firstPoint.x / floorScale), 2) + Math.pow((endPoint.y / floorScale - firstPoint.y / floorScale), 2));
    var x = (endPoint.x + firstPoint.x) / 2;
    var y = (endPoint.y + firstPoint.y) / 2;

    endPoint = snapXYZ(x, y, z, _cubeSize);
    var wallname = wallPointId;
    if (drawModeRun || _drawMode.mode == ControlModes.DrawContinuePoly) {
        wallname = "_temp";
    }

    if (showWallInf) {
        showWallInfo(endPoint, wallname, dist);
    }
}

/*
    function to display the length of the wall on hover
    uses renderer object
 */
function showWallInfo(endPoint, wallname, dist) {
    var vector = new THREE.Vector3();
    var widthHalf = 0.5 * renderer.context.canvas.width;
    var heightHalf = 0.5 * renderer.context.canvas.height;

    var container;
    var divId = "showWallPos_" + wallname;
    var divComp = $("#" + divId);
    if (divComp.length > 0) {
        container = divComp[0];
    } else {
        container = document.createElement("div");
        container.id = divId;
        container.style.cssFloat = "width:80px;opacity:0.9;cursor:pointer";
        container.style.position = 'absolute';
        container.style.width = '40px';
    }
    $(container).text(Math.trunc(dist)).css({'color': 'white'});

    $("body").append(container);

    var voxel = createVoxelAt(endPoint, "red");
    voxel.updateMatrixWorld();
    vector.setFromMatrixPosition(voxel.matrixWorld);
    vector.project(camera);
    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    container.style.left = vector.x + "px";
    container.style.top = vector.y + 45 + "px";
}

var continueLinePoly;
function commitPoly() {
    if (_tempCubes.length < 2) {
        return false;
    }

    var random = Math.floor(Math.random() * 1000) + 1;
    var poly = {
        polyId: _tempCubes[0].id || random,
        cubes: _tempCubes,
        line: _tempLine,
        color: _tempCubes[0].pen,
        lineId: _tempLine.id
    };

    if (typeof continueLinePoly == "undefined") {
        if (typeof arguments[0] == "undefined") {
            _floors.floorData[_floors.selectedFloorIndex].gridData.polys.push(poly);


        } else if (typeof _floors.floorData[_floors.selectedFloorIndex].gridData.polys[arguments[0]] !== "undefined") {
            poly.polyId = _floors.floorData[_floors.selectedFloorIndex].gridData.polys[arguments[0]].polyId;
            _floors.floorData[_floors.selectedFloorIndex].gridData.polys[arguments[0]] = poly;
        }

        if (_drawMode.mode == ControlModes.DrawContinuePoly) {
            continueLinePoly = poly;
        }
    } else {
        var contPoly, polys = _floors.floorData[_floors.selectedFloorIndex].gridData.polys;
        $.each(polys, function (i, eachpoly) {
            if (eachpoly.polyId == continueLinePoly.polyId) {
                var index = polys.indexOf(eachpoly);
                polys[index] = poly;
                contPoly = eachpoly;
            }
        });
    }

    saveConfig(true);
    if (_drawMode.mode !== ControlModes.DrawContinuePoly) {
        _tempCubes = [];
        _tempLine = undefined;
    }
    return poly;
}

//initgrid function Cartographer
function createPlane() {
    var index = 0;
    if (_floors.selectedFloorIndex > 0) {
        index = _floors.selectedFloorIndex || 0;
    }

    var selectedFloor = _floors.floorData[index];
    var width = selectedFloor.mesh.geometry.parameters.width;
    var height = selectedFloor.mesh.geometry.parameters.height;
    var geometry = new THREE.PlaneBufferGeometry(width, height);

    plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        visible: false,
        depthWrite: false
    }));

    plane.position.x = selectedFloor.mesh.position.x;
    plane.position.y = selectedFloor.mesh.position.y;
    plane.position.z = selectedFloor.mesh.position.z;
    plane.name = "plane";
    scene.add(plane);

    if (typeof selectedFloor.gridData === "undefined") {
        selectedFloor.gridData = {
            'polys': [],
            'plane': plane,
            'cubeSize': _cubeSize
        };
    }
}

/*
    function to handle all mouse events - draw single and continous walls,
    move walls, move devices
 */
var selectPolyCubeIndex, tmpLineArr = [];
function onDocumentMouseMoveDraw(event) {
    event.preventDefault();

    if (typeof _floors.floorData[0].gridData == "undefined")return false;

    _drawMode.mouseX = ((event.clientX - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((event.clientY - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
    var intersects = raycaster.intersectObject(plane, true);
    if (intersects.length > 0) {
        if (ControlModes.MoveDevice === _drawMode.mode && typeof selectedDevice !== "undefined" && mouseDownDraw) {
            var touchpoint = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);

            selectedDevice.position.set(touchpoint.x, touchpoint.y, touchpoint.z);
            selectedDevice.deviceOutline.copy(selectedDevice);
        } else if (ControlModes.PanSelect === _drawMode.mode && typeof panMove !== "undefined" && mouseDownDraw) {
            var touchpoint = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            var xdiff = touchpoint.x - panMove.point.x;
            var ydiff = touchpoint.y - panMove.point.y;

            var scenex = scene.position.x + xdiff;
            var sceney = scene.position.y + ydiff;
            var scenePoint = snapPoint(new THREE.Vector3(scenex, sceney, plane.position.z + _cubeSize / 2), _cubeSize);

            scene.position.set(scenePoint.x, scenePoint.y, scenePoint.z);
            panMove = {'point': touchpoint};
        } else if (selectedPolys.length < 1 && mouseDownDraw && typeof selectPolyCube !== "undefined") {
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _tempCubes = [];
            $.each(singleSelectWall.cubes, function (i, cube) {
                if (cube.name == selectPolyCube.name) {
                    cube.position.copy(point);
                    _tempCubes.push(cube);
                } else {
                    _tempCubes.push(cube);
                }
            });
            scene.remove(singleSelectWall.line);
            var polys = _floors.floorData[0].gridData.polys;
            $.each(polys, function (i, poly) {
                if (poly.polyId == singleSelectWall.polyId) {
                    selectPolyCubeIndex = polys.indexOf(poly);
                    return false;
                }
            });
            _drawMode.selectedObject = undefined;
            redrawLine();
        } else if (mouseDownDraw && typeof singleSelectWall !== "undefined") {
            _drawMode.selectedObject = undefined;
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            var touchPoint = singleSelectWall.touchpoint;

            if (selectedPolys.length < 1 || typeof selectPolyCube !== "undefined") {
                $.each(_tempCubes, function (i, cube) {
                    scene.remove(cube);
                });

                _tempCubes = [];
                $.each(singleSelectWall.cubes, function (i, cube) {
                    var xdiff = cube.position.x - touchPoint.x;
                    var ydiff = cube.position.y - touchPoint.y;


                    var cubex = point.x + xdiff;
                    var cubey = point.y + ydiff;
                    var voxelpoint = snapPoint(new THREE.Vector3(cubex, cubey, plane.position.z + _cubeSize / 2), _cubeSize);

                    var newCube = createVoxelAt(voxelpoint, "silver");
                    _tempCubes.push(newCube);
                    scene.add(newCube);
                    removePoint(cube);
                });
                scene.remove(singleSelectWall.line);
                redrawLine();

            } else {

                var polys = _floors.floorData[0].gridData.polys;
                $.each(selectedPolys, function (i, poly) {
                    var index = polys.indexOf(poly);
                    if (tmpLineArr.length && typeof tmpLineArr[index] !== "undefined") {
                        $.each(tmpLineArr[index]._tempCubes, function (i, cube) {
                            scene.remove(cube);
                        });
                    }

                    _tempCubes = [];
                    $.each(poly.cubes, function (i, cube) {
                        var xdiff = cube.position.x - touchPoint.x,
                            ydiff = cube.position.y - touchPoint.y,
                            cubex = point.x + xdiff,
                            cubey = point.y + ydiff,
                            voxelpoint = snapPoint(new THREE.Vector3(cubex, cubey, plane.position.z + _cubeSize / 2), _cubeSize);

                        scene.remove(cube);

                        var newCube = createVoxelAt(voxelpoint, "silver");
                        _tempCubes.push(newCube);
                        scene.add(newCube);
                    });
                    moveLine(poly.line);
                    tmpLineArr[index] = {
                        'poly': poly,
                        '_tempLine': _tempLine,
                        '_tempCubes': _tempCubes
                    };
                    _tempCubes = [];
                    _tempLine = undefined;
                });
            }

            return false;
        } else if (_drawMode.mode == ControlModes.DrawPoly) {
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;

            _drawMode.selectedObject = intersects[0];

            if (_tempCubes.length < 1)return false;
            redrawLine();
        } else if (_drawMode.mode == ControlModes.DrawContinuePoly) {
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;
            _drawMode.selectedObject = intersects[0];
            if (_tempCubes.length < 1)return false;
            redrawLine();
        } else if (_drawMode.mode == ControlModes.Select && _tempSelectCubes.length) {
            if (selectDrawBox)return false;
            if (_tempSelectLine !== "undefined") {
                scene.remove(_tempSelectLine);
            }
            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;

            drawSelectWall(intersects[0]);
        } else if (typeof _selectedDragDevice !== "undefined") {
            var offset = new THREE.Vector3();
            _selectedDragDevice.position.copy(intersects[0].point.sub(offset));
            _selectedDragDevice.deviceOutline.position.copy(intersects[0].point.sub(offset));
        } else if (_drawMode.mode == ControlModes.SetScale) {
            if (_tempScaleCube.length < 1)return false;

            if (_tempScaleLine !== "undefined") {
                scene.remove(_tempScaleLine);
            }

            var point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
            _cursorVoxel.position.x = point.x;
            _cursorVoxel.position.y = point.y;
            _cursorVoxel.position.z = point.z;
            _cursorVoxel.visible = true;
            _drawMode.selectedObject = intersects[0];

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({color: "silver"});    // Default line color. Should be set to the poly's color or the color of the cubes.
            var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
            var endPoint;

            endPoint = snapPoint(_tempScaleCube[0].position, _cubeSize);
            geometry.vertices.push(endPoint);

            endPoint = snapXYZ(_drawMode.selectedObject.point.x, _drawMode.selectedObject.point.y, z, _cubeSize);
            geometry.vertices.push(endPoint);

            if (_tempScaleCube.length > 0) {
                material.color = _tempScaleCube[0].material.color;
            }

            _tempScaleLine = new THREE.Line(geometry, material);
            _tempScaleLine.name = "tempScaleLine";
            scene.add(_tempScaleLine);
        } else {

            var polys = _floors.floorData[0].gridData.polys;
            var polyline = [];
            $.each(polys, function (i, poly) {
                polyline.push(poly.line);
            });

            if (polyline.length) {
                var intersects = raycaster.intersectObjects(polyline, true);
            }

            if (intersects.length > 0) {
                var obj = intersects[0].object;
                $.each(polys, function (i, poly) {
                    if (obj == poly.line) {
                        var firstPoint, endPoint;
                        $.each(poly.cubes, function (j) {
                            var withinLine = checkWithinLine(intersects[0].point, poly.cubes[j], poly.cubes[j + 1]);
                            if (withinLine) {
                                firstPoint = poly.cubes[j].position;
                                endPoint = poly.cubes[j + 1].position;
                                if (typeof firstPoint !== "undefined") {
                                    showWallInf = true;
                                    wallInfoCalc(firstPoint, endPoint, "show");
                                    return false;
                                }
                            }

                        });
                    }
                });
            } else {
                $("div[id^=showWallPos_]").remove();
            }
        }
    }
}

function removePoint(_tempcube) {
    $("#showWallPos_" + _tempcube.id).remove();
    scene.remove(_tempcube);

}

function onDocumentMouseUpDraw(event) {
    event.preventDefault();
    if (showWallInf) {
        $("div[id^=showWallPos_]").remove();
    }
    _drawMode.mouseX = ((event.clientX - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((event.clientY - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
    var intersects = raycaster.intersectObject(plane, true);

    if (typeof selectedDevice !== "undefined") {
        selectedDevice = undefined;

    } else if (_drawMode.mode == ControlModes.SetScale) {
        if (_tempScaleCube.length > 1 && typeof _tempScaleLine !== "undefined") {
            var distanceX = Math.abs(_tempScaleCube[0].position.x - _tempScaleCube[1].position.x);
            var distanceY = Math.abs(_tempScaleCube[0].position.y - _tempScaleCube[1].position.y);
            var distancePx = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            $.each(_tempScaleCube, function (i, cube) {
                scene.remove(cube);
            });
            scene.remove(_tempScaleLine);
            scene.remove(_cursorVoxel);

            _tempScaleCube = [];
            _tempScaleLine = undefined;

            if ($('.scaleMeters')[0].checked === true) {
                var distanceM = prompt("Distance in meters : ", "");
                if (distanceM != null) {
                    setNewScale(distanceM, distancePx);
                }
            } else {
                var distanceF = prompt("Distance in feet : ", "");
                if (distanceF != null) {
                    setNewScale(distanceF * 0.3048, distancePx);
                }
            }
        }
    } else if (tmpLineArr.length > 0) {
        var index, polys = _floors.floorData[0].gridData.polys;
        $.each(tmpLineArr, function (i, line) {
            if (typeof line !== "undefined") {
                var poly = findPoly(line._tempLine.id);
                index = polys.indexOf(poly);
                polys[index].cubes = line._tempCubes;
                polys[index].line = line._tempLine;
            }
        });
        tmpLineArr = [];
        saveConfig(true);

    } else if (typeof _selectedDragDevice !== "undefined") {
        _selectedDragDevice = undefined;
        saveConfig(true);
    } else if (typeof singleSelectWall !== "undefined") {
        if (typeof _tempLine == "undefined") {
            selectedPolys = [];
            selectedPolys.push(singleSelectWall);
            singleSelectWall = undefined;
            return false;
        }
        var index, polys = _floors.floorData[0].gridData.polys;
        $.each(polys, function (i, poly) {
            if (poly.polyId == singleSelectWall.polyId) {
                index = polys.indexOf(poly);
                return false;
            }
        });

        if (typeof _tempLine !== "undefined") {
            _tempLine.material.color = new THREE.Color("red");
        }

        $.each(_tempCubes, function (i, cube) {
            cube.material.color = new THREE.Color("red");
        });

        commitPoly(index);
        singleSelectWall = undefined;
    } else if (typeof selectPolyCube !== "undefined") {

        if (typeof _tempLine !== "undefined") {
            _tempLine.material.color = new THREE.Color("red");
        }

        $.each(_tempCubes, function (i, cube) {
            cube.material.color = new THREE.Color("red");
        });
        commitPoly(selectPolyCubeIndex);
        selectPolyCube = undefined;


    } else if (_drawMode.mode == ControlModes.Select) {

        _drawMode.selectedObject = intersects[0];
        var voxel = createVoxelAt(_drawMode.selectedObject.point, "silver");
        scene.add(voxel);
        _tempSelectCubes.push(voxel);


        if (_tempSelectCubes.length > 1) {
            scene.remove(_tempSelectLine);
            drawSelectWall(intersects[0]);
            selectDrawBox = true;
            var xdiff = _tempSelectCubes[0].position.x - intersects[0].point.x;
            var ydiff = _tempSelectCubes[0].position.y - intersects[0].point.y;
            if ((xdiff > 10 || xdiff < -10) && (ydiff > 10 || ydiff < -10)) {
                showSelectedPoly();

            }
            $.each(_tempSelectCubes, function (i, cube) {
                scene.remove(cube);
            });
            _tempSelectCubes = [];
        }
        scene.remove(_tempSelectLine);
    }
    mouseDownDraw = !1;
}

/*
    function to draw the select box
    takes the four points of mouse click and finishes the rectangle
 */
function drawSelectWall(selectedObject) {
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: "silver"});    // Default line color. Should be set to the poly's color or the color of the cubes.
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    var endPoint;

    //point one
    var endPointFirst = snapPoint(_tempSelectCubes[0].position, _cubeSize);
    geometry.vertices.push(endPointFirst);

    //point three
    endPoint = snapXYZ(_tempSelectCubes[0].position.x, selectedObject.point.y, z, _cubeSize);
    geometry.vertices.push(endPoint);

    //point two
    endPoint = snapXYZ(selectedObject.point.x, selectedObject.point.y, z, _cubeSize);
    geometry.vertices.push(endPoint);


    //point four
    endPoint = snapXYZ(selectedObject.point.x, _tempSelectCubes[0].position.y, z, _cubeSize);
    geometry.vertices.push(endPoint);
    geometry.vertices.push(endPointFirst);

    if (_tempSelectCubes.length > 0) {
        material.color = _tempSelectCubes[0].material.color;
    }
    _tempSelectLine = new THREE.Line(geometry, material);
    _tempSelectLine.name = "tempSelectLine";
    scene.add(_tempSelectLine);

}

function lastTouchPoint() {
    return lastMouseClick;
}

function getTouchPoint(x, y) {
    if (typeof plane == "undefined") {
        createPlane();
    }

    _drawMode.mouseX = ((x - container.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1;
    _drawMode.mouseY = -((y - container.offsetTop) / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(_drawMode.mouseX, _drawMode.mouseY), camera);
    var intersects = raycaster.intersectObject(plane, true);
    var point;
    if (intersects.length > 0) {
        point = snapPoint(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z + _cubeSize / 2), _cubeSize);
    }
    return point;
}

/*
    function to create the voxel on click in few modes
    uses three js Mesh object
 */
function createVoxelAt(point, color) {
    var material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        color: color,
        depthWrite: false,
        visible: _isCubesVisible
    });
    _cubeGeometry = new THREE.CubeGeometry(_cubeSize, _cubeSize, _cubeSize);
    var voxel = new THREE.Mesh(_cubeGeometry, material);
    voxel.position.copy(point);
    if (typeof _drawMode.selectedObject !== "undefined" && typeof _drawMode.selectedObject.face !== "undefined")
        voxel.position.add(_drawMode.selectedObject.face.normal);
    voxel.position.divideScalar(_cubeSize).floor().multiplyScalar(_cubeSize).addScalar(_cubeSize / 2);
    voxel.position.z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    voxel.name = "cube" + _currentPen + '_' + voxel.position.x + ',' + voxel.position.y;
    voxel.pen = _currentPen;
    voxel.polyIndex = polylength++;
    return voxel;
}

/*
    function to loadwalls from the config
 */
function loadWalls(polys) {
    var z = _floors.floorData[_floors.selectedFloorIndex].altitude + (_cubeSize / 2);  //hack because cubes aren't lining up with the floor
    if (polys.length) {
        $.each(polys, function (i, poly) {
            _tempCubes = [];
            $.each(poly.points, function (i, point) {
                var snpoint = snapXYZ(point.x, point.y, z, _cubeSize);
                var voxel = createVoxelAt(snpoint, CubeColors.properties[_currentPen].hex);
                scene.add(voxel);
                _tempCubes.push(voxel)
            });
            redrawLine();
            commitPoly();
        });
    }
}

function snapXYZ(x, y, z, gridSize) {
    return new THREE.Vector3(x, y, z)
        .divideScalar(gridSize).floor().multiplyScalar(gridSize).addScalar(gridSize / 2);
}

function snapPoint(point, gridSize) {
    return new THREE.Vector3(point.x, point.y, point.z)
        .divideScalar(gridSize).floor().multiplyScalar(gridSize).addScalar(gridSize / 2);
}


function drawMode() {
    var mode = 0;
    var startX = undefined;
    var startY = undefined;
    var selectedObject = undefined;
    var mouseX = undefined;
    var mouseY = undefined;
}

/*
    function to select wall on click of wall and drawing of select box
 */
var singleSelectWall, selectPolyCube;
function selectWallFunc() {
    try {
        if (typeof _floors.floorData[0].gridData !== "undefined" && _floors.floorData[0].gridData.polys.length) {
            var polys = _floors.floorData[0].gridData.polys;
            var polycube = [], polyline = [];
            $.each(polys, function (i, poly) {
                poly.line.material.color = new THREE.Color("red");
                polyline.push(poly.line);
                if (poly.cubes.length) {
                    $.each(poly.cubes, function (j, cube) {
                        polycube.push(cube);
                        cube.material.color = new THREE.Color("red");
                    });
                }
            });
            var singleWall;
            if (polyline.length) {
                var intersects = raycaster.intersectObjects(polyline, true);
                if (intersects.length > 0) {
                    $.each(polys, function (i, poly) {
                        if (poly.line.name === intersects[0].object.name) {
                            poly.line.material.color = new THREE.Color("silver");
                            singleWall = poly;//return false;
                            singleWall.touchpoint = intersects[0].point;
                            $.each(poly.cubes, function (j, cube) {
                                cube.material.color = new THREE.Color("silver");
                            });
                        }
                    });
                }
            }
            if (polycube.length) {
                var intersects = raycaster.intersectObjects(polycube, true);
                if (intersects.length > 0) {
                    $.each(polys, function (i, poly) {
                        if (poly.cubes.length) {
                            $.each(poly.cubes, function (j, cube) {
                                if (intersects[0].object.name == cube.name) {
                                    poly.line.material.color = new THREE.Color("silver");
                                    singleWall = poly;//return false;
                                    selectPolyCube = cube;
                                    $.each(poly.cubes, function (j, cube) {
                                        cube.material.color = new THREE.Color("silver");
                                    });

                                }
                            });
                        }
                    });
                }
            }
            if (typeof singleWall !== "undefined") {
                singleSelectWall = singleWall;
            } else {
                singleSelectWall = undefined;

                $.each(polys, function (i, poly) {
                    poly.line.material.color = new THREE.Color("red");
                    if (poly.cubes.length) {
                        $.each(poly.cubes, function (j, cube) {
                            polycube.push(cube);
                            cube.material.color = new THREE.Color("red");
                        });
                    }
                });

            }
        }
    } catch (e) {
        console.log(e);

    }
}