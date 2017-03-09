/**
 * Created by Vamsi on 3/3/2017.
 */
var items = {
    5: "ATOM10,ATOM27,ATOM50",
    8: "AEON,WASP"
};

function setDropDown() {
    var $dropdown = $("#deviceType");

    $.each(items, function(item, value) {
        var key = $dropdown.val();
        var vals = [];
        if (item === key) {
            switch(key) {
                case "5":
                    vals = value.split(",");
                    break;
                case "8":
                    vals = value.split(",");
                    break;
                case 'base':
                    vals = ['Please choose from above'];
            }

            var $secondChoice = $("#deviceModel");
            $secondChoice.empty();
            $.each(vals, function(index, value) {
                $secondChoice.append("<option>" + value + "</option>")
            });
        }
    });
}

function setTooltip() {
    $.widget("ui.tooltip", $.ui.tooltip, {
        options: {
            content: function () {
                return $(this).prop('title');
            }
        }
    });
    $(function () {
        $('a').attr('title', function(){
            return $(this).next('.tooltip').remove().html()
        });
        $(document).tooltip({
            tooltipClass: "tooltipStyle"
        });
    });
}

function setOffSetTooltip() {
    $(".toolbox-tools, .deviceMenu").draggable({
        handle: ".panel-heading",
        stop: function(evt, el) {
            // Save size and position in cookie
            /*
             $.cookie($(evt.target).attr("id"), JSON.stringify({
             "el": $(evt.target).attr("id"),
             "left": el.position.left,
             "top": el.position.top,
             "width": $(evt.target).width(),
             "height": $(evt.target).height()
             }));
             */
        }
    }).resizable({
        handles: "e, w, s, se",
        stop: function(evt, el) {
            // Save size and position in cookie
            /*
             $.cookie($(evt.target).attr("id"), JSON.stringify({
             "el": $(evt.target).attr("id"),
             "left": el.position.left,
             "top": el.position.top,
             "width": el.size.width,
             "height": el.size.height
             }));
             */
        }
    });
}