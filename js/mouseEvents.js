/**
 * Created by Vamsi on 3/3/2017.
 */
function onMouseDown (e) {
    e.preventDefault();

    switch (_drawMode.mode) {
        case ControlModes.PlaceDevice:
            break;
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
    }
}
