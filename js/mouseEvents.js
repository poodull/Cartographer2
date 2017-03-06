/**
 * Created by Vamsi on 3/3/2017.
 */
function onMouseDown (event) {
    event.preventDefault();

    switch (_drawMode.mode) {
        case ControlModes.PlaceDevice:
            $('#addDeviceMenu')[0].removeAttribute('hidden');
            break;
    }
}
