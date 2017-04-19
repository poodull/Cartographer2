/**
 * Created by Vamsi on 3/6/2017.
 */

var _devices = new Devices();

function Devices() {
    this.deviceList = [];
    this.meshList = [];
    this.visibleDevices = [];

    this.clear = function () {
        this.meshList.forEach(function (device) {
            scene.remove(device);
            scene.remove(device.edges);
        });

        this.deviceList.length = 0;
        this.meshList.length = 0;
        this.visibleDevices.length = 0;
    };
}

function refreshDevices () {
    var config, temp;

    if (typeof localStorage !== "undefined") {
        config = localStorage.getItem("config");
    }

    if (config !== null) {
        //Create a new blob to hold the data
        temp = (new Blob([config], { type: "text/plain;charset=utf-8" }));
        var reader = new FileReader();  //set up the file reader
        reader.onloadend = function () {
            try {  //obtain the config through the file reader.
                config = JSON.parse(reader.result);
            }
            catch (e) {
                console.error("Could not read config file. No floors or devices will be loaded.");
                return;
            }
        };
        if (temp != undefined) {
            reader.readAsText(temp);
        }
    }
}
