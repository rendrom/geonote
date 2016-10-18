angular.module('mapster').service('mapHelpers', ['appConf', function (appConf) {
    return {
        getParametersUrl: function (from_url) {
            var param;
            var params = ['in_bbox', 'in_region'];
            for (var fry = 0; fry < params.length; fry++) {
                param = appConf.getUrlParameters(params[fry], "", true);
                if (param) {
                    param = param ? '?' + params[fry] + '=' + param : param;
                    break;
                }
            }
            return from_url + param;
        },
        findInMapLayer: function (id, layer) {
            /**
             * @return {object} layer
             * @param  {int}    id      element id
             * @param  {object} layer   features layer where to look for
             */
            var features = layer.getLayers();
            for (var p = 0; p < features.length; p++) {
                if (features[p].feature.id === id) {
                    return features[p];
                }
            }
            return null;
        },
        findInMapLayerAndRemove: function (id, layer) {
            var feature = this.findInMapLayer(id, layer);
            if (feature) {
                layer.removeLayer(feature);
                return feature;
            }
            return null;
        },

        goToOSM: function (map) {
            var mapCenter = map.getCenter();
            var mapZoom = map.getZoom();
            var osmurl = 'http://openstreetmap.ru/';
            window.open(osmurl + '#map=' + mapZoom + '/' + mapCenter.lat.toFixed(3) + '/' + mapCenter.lng.toFixed(3));
        },

        applyScope: function (elem, apply) {
            /**
             * change AngularJS data outside the scope
             * @param {string} elem Dom ID under ngController
             * @param {object} apply Dict of scope param to change
             */
            var feature = document.getElementById(elem);
            if (feature) {
                var scope = angular.element(feature).scope();
                scope.safeApply = function (fn) {
                    var phase = this.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        if (fn && (typeof(fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };
                scope.safeApply(function () {
                    for (var fry in apply) {
                        if (apply.hasOwnProperty(fry)) {
                            var key_name = fry.split(".");
                            if (key_name.length === 1) {
                                scope[fry] = apply[fry];
                            }
                            else if (key_name.length === 2) {
                                scope[key_name[0]][key_name[1]] = apply[fry];
                            }
                        }
                    }
                });
            }
        },
        createGeoJsonEntry: function (id, geom) {
            /**
             * create geoJson feature from WKT (POST responce)
             * @param {int} id entry.id
             * @param {object} geom wkt geom
             */
            return {
                "type": "Feature",
                "id": id,
                "properties": {
                    "id": id
                },
                "geometry": {
                    "type": geom.type,
                    "coordinates": geom.coordinates
                }
            };
        },

        toWKT: function (layer) {
            var lng, lat, coords = [];
            if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                var latlngs = layer.getLatLngs();
                for (var i = 0; i < latlngs.length; i++) {
                    coords.push(latlngs[i].lng + " " + latlngs[i].lat);
                    if (i === 0) {
                        lng = latlngs[i].lng;
                        lat = latlngs[i].lat;
                    }
                }
                if (layer instanceof L.Polygon) {
                    return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
                } else if (layer instanceof L.Polyline) {
                    return "LINESTRING(" + coords.join(",") + ")";
                }
            } else if (layer instanceof L.Marker) {
                return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
            }
        }
    };
}]);