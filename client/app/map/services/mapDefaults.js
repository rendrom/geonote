angular.module('mapster')
    .factory('mapDefaults',['NAMES', function (NAMES) {
        function controlDefaults() {
            return {
                zoom: true,
                fullscreen: true,
                layers: true,
                scale: true,
                measure: false,
                loading: true,
                coordinate: false,
                zoomBox: false,
                bookmarks: false,
                draw: false
            };
        }

        function mapDefaults() {
            return {
                // Default
                center: [55.5, 38.0],
                zoom: 5,
                //layers: layers
                minZoom: undefined,
                maxZoom: undefined,
                maxBounds: undefined,
                dragging: true,
                touchZoom: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                trackResize: true,
                closePopupOnClick: true,
                zoomControl: false,
                attributionControl: false
            };
        }

        var imagePath = '/static/img/';

        var SingleIcon = L.Icon.extend({
            options: {
                iconSize: [20, 26],
                iconAnchor: [10, 26],
                popupAnchor: [-3, -76],
                shadowUrl: imagePath+'shadow.svg',
                shadowRetinaUrl: imagePath+'shadow.svg',
                shadowSize: [18, 6],
                shadowAnchor: [0, 9]
            }
        });

        var singleCurrentIcon = new SingleIcon({
            iconUrl: imagePath+'single_current.svg',
            iconRetinaUrl: imagePath+'single_current.svg'
        });

        var singleIcon = new SingleIcon({
            iconUrl: imagePath+'single_stroke.svg',
            iconRetinaUrl: imagePath+'single_stroke.svg'
        });


        var service = {
            singleIcon: singleIcon,
            singleCurrentIcon: singleCurrentIcon,
            mapDefaults: mapDefaults(),
            controlDefaults: controlDefaults(),

            EntryOverlaysHtml: "<img src='"+ imagePath +
                        "single_stroke.svg' width='20' height='26'>&nbsp;"+NAMES.entry.short_name
        };
        return service;
    }]);