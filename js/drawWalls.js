/**
 * Created by Vamsi on 3/3/2017.
 */

var _drawMode = new drawMode();
var ControlModes = {
    Orbit: 'camera',
    EraseDots: 'eraseDots',
    SetScale: 'setScale',
    SetOrigin: 'setOrigin',
    DeviceManager: 'deviceManager',
    PlaceDevice: 'placeDevice',
    AddDevice: 'addDevice',
    MoveDevice: 'moveDevice',
    EditDevice: 'editDevice',
    DrawPoly: 'drawPoly',
    Select: 'select'
};

function drawWall() {

}


function drawMode() {
    var mode = 0;
    var startX = undefined;
    var startY = undefined;
    var selectedObject = undefined;
    var mouseX = undefined;
    var mouseY = undefined;
}