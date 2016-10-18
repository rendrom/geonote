
function createPrintMap(id) {
    var basemap;
    if (DEBUG && (document.location.hostname == "localhost" || document.location.hostname == "127.0.0.1")) {
        basemap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        });
    }
    else {
        basemap =  L.tileLayer(tileServURL + '/tiles/'+ entryBase.layer + '/' +entryBase.epsg +'/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: entryBase.attribution
		});
    }

    var layer = findInMapLayer(id, entryLayer);
    var layerLatLng = [layer.getLatLng().lat, layer.getLatLng().lng];
    printmap = L.map('printmap', {
        zoomControl:false,
        attributionControl: false,
        keyboard: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        layers:[basemap]
    }).setView(layerLatLng, 16);
    var circleMarker = new L.CircleMarker(layerLatLng, {fillColor: 'blue', fillOpacity: 0.5, stroke: false});
    circleMarker.addTo(printmap);
    printmap.setActiveArea({
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        height: $('#printmap').css("height")
    });
    printmap.invalidateSize();
    basemap.on('load', function (e) {
        setTimeout(function() {
            var modalWindow = document.getElementById('printModal');
            var data = modalWindow.className;
            modalWindow.className += " html2canvasreset";
            html2canvas([document.getElementById('export-frame')], {
                logging: false,
                profile: false,
                useCORS: true,
                background: '#FFFFFF',
                onrendered: function (canvas) {
//                    print.href = img.replace(/^data[:]image\/(png|jpg|jpeg)[;]/i, "data:application/octet-stream;");
                    var btnContainer = document.getElementById('saveimg');
                    btnContainer.innerHTML = '';
                    var img = canvas.toDataURL();
                    var link = document.createElement("a");
                    link.download = "export_entry_" + id + ".png";
                    link.href = img.replace(/^data[:]image\/(png|jpg|jpeg)[;]/i, "data:application/octet-stream;");
                    link.className = 'btn btn-default pull-right';
                    link.innerHTML = "Сохранить изображение";
                    btnContainer.appendChild(link);
                    modalWindow.className = data;
                }
            });
        }, 1000);
    });
}

//
//if (DEBUG) {
////    var zoomtext = document.getElementById("zoom");
//    var zoomtext = document.createElement("div");
//    zoomtext.id = 'zoom';
//    zoomtext.innerHTML = map.getZoom();
//    document.body.appendChild(zoomtext)
//
//    map.on('zoomend', function (e) {
//        zoomtext.innerHTML = map.getZoom();
//    })
//}
