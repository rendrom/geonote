angular.module('mapster')
    .factory('emap', ['$q','$injector','$window', '$location', '$http','mapDefaults', 'mapHelpers', 'modalService','NAMES',
        function ($q, $injector, $window, $location, $http, mapDefaults, mapHelpers, modalService, NAMES) {
            var mapcursor;
            var L = $window.L;
            var withExtend = true;
            var mapOptions = mapDefaults.mapDefaults;
            var Entries;
            function getEntries() {
                if (!Entries) {
                    Entries = $injector.get('Entries');
                }
            }
            function isTight() {
                return $window.innerWidth < 767;
            }

            var entryOSM = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
            var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
            });
            var short_name = NAMES.entry.short_name ? NAMES.entry.short_name + ':': '';
            var entryLayer = L.geoJson(null, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: mapDefaults.singleIcon,
                        title: short_name + feature.properties.entryid,
                        riseOnHover: true
                    });
                },
                onEachFeature: function (feature, layer) {
                    getEntries();
                    if (feature.properties) {
                        layer.on("click", function(e){
                            //$window.location.href = '#/'+Entries.model+'/'+feature.id;
                            //$location.path('/' + Entries.model + '/' + feature.id);
                            $window.location.href = mapHelpers.getParametersUrl('#/'+
                            Entries.username+'/layer/'+Entries.model+'/'+feature.id);
                        });
                    }
                }
            });

            var regionLayer = L.geoJson(null, {
                fillOpacity: 0
            });

            var addressExampleItems = L.geoJson(null);

            var drawnItems = new L.FeatureGroup();

            var searchBox = new L.FeatureGroup();

            var markerClusters = L.markerClusterGroup({
                maxClusterRadius: 20,
                iconCreateFunction: function (cluster) {
                    return L.divIcon({
                        iconSize: [30, 40],
                        iconAnchor: [15, 40],
                        popupAnchor: [-3, -76],
                        html: cluster.getChildCount(),
                        className: 'mycluster'
                    });
                },
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });

            function clearAllLayer () {
                redrawEntryLayer();
                service.map.removeLayer(entryLayer);
                var layers = [drawControl, entryLayer, drawnItems, regionLayer, markerClusters];
                for (var fry=0; fry<layers.length; fry++){
                    if (service.map.hasLayer(layers[fry])) {
                        layers[fry].clearLayers();
                    }
                }
            }

            var drawControl = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    circle: false,
                    rectangle: {
                        metric: true,
                        showArea: false,
                        shapeOptions: {
                            clickable: false
                        }
                    },
                    marker: {
                        icon: mapDefaults.singleCurrentIcon
                    }
                },
                edit: {
                    featureGroup: drawnItems,
                    selectedPathoptions: {
                        maintainColor: true,
                        opacity: 0.3
                    }
                }
            });

            angular.extend(mapOptions, {
                maxZoom: 18,
                zoom: 6,
                layers: [entryOSM, markerClusters, drawnItems, regionLayer, addressExampleItems, searchBox]
            });

            function getMapHeight() {
                var mapid = angular.element(service.map._container.id);
                var height = angular.element("#map").css("height");
                return height;
            }

            var activeAreaOptions = {
                position: "absolute",
                top: "0px",
                left: "0px",
                right: "0px",
                height: "100px"
            };


            function getViewport() {
                var width = angular.element(".leaflet-sidebar").css("width");
                var height = getMapHeight();
                var options;
                if (service.sidebar.isVisible()) {
                    options = angular.extend(activeAreaOptions, {left: width, height: height});
                    service.setActiveArea(options);
                } else {
                    options = angular.extend(activeAreaOptions, {height: height, left: "0px"});
                }
                service.setActiveArea(options);
            }
            var sidebar;

            function setSidebar() {
                sidebar = L.control.sidebar("sidebar", {
                    closeButton: true,
                    position: "left"
                });
                return sidebar;
            }

            function checkSidebarIsNarrow(sidebar) {
                var width = angular.element(".leaflet-sidebar")[0];
                if (width!==undefined) {
                    width = width.clientWidth;
                    if (width) {
                        return width < 390;
                    }
                }
                return false;
            }

            function sidebarClick(id) {
                var layer;
                var features = markerClusters.getLayers();
                for (var fry = 0; fry < features.length; fry++) {
                    if (features[fry].feature.id === id) {
                        layer = features[fry];
                        break;
                    }
                }
                if ($window.innerWidth <= 767) {
                    if (!sidebar.isVisible()) {
                        sidebar.show();
                    }
                }
                else {
                    sidebar.show();
                }
                getViewport(service.map);
                clickToLayer(layer);
            }

            function clickToLayer(layer) {
                if (layer) {
                    if (layer.feature.geometry.type === 'Point') {
                        var latlng = [layer.getLatLng().lat, layer.getLatLng().lng];
                        var latLngGeom = [layer.feature.geometry.coordinates[0], layer.feature.geometry.coordinates[1]];
                        var parentMarkers = layer.__parent._markers;
                        if (parentMarkers.length > 1) {
                            var brothers = [];
                            for (var fry = 0; fry < parentMarkers.length; fry++) {
                                var brotherLatLngGeom = [
                                    parentMarkers[fry].feature.geometry.coordinates[0],
                                    parentMarkers[fry].feature.geometry.coordinates[1]];
                                var inOneCluster = parentMarkers.length > 5 ? true : latLngGeom.join(',') === brotherLatLngGeom.join(',');
                                if (parentMarkers[fry].feature.id && inOneCluster) {
                                    brothers.push(parentMarkers[fry].feature.id);
                                }
                            }
                            if (brothers.length > 1) {
                                mapHelpers.applyScope('feature', {'brothers': brothers});
                            }
                        }
                        markerClusters.zoomToShowLayer(layer, function () {
                            service.map.setView(latlng);
                        });
                    }
                    else {
                        service.map.fitBounds(layer.getBounds());
                    }
                }
            }

            /* Leaflet Draw */
            L.drawLocal.draw.handlers.marker.tooltip.start = 'Нажмите на карту, чтобы поместить маркер.';
            L.drawLocal.edit.handlers.edit.tooltip.text = 'Нажмите на маркер и перемещайте мышь.';
            L.drawLocal.edit.handlers.edit.tooltip.subtext = false;
            L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Рисуйте прямоугольник<br> с зажатой кнопкой';
            L.drawLocal.draw.handlers.simpleshape.tooltip.end = 'Отпустите кнопку для завершения';

            function initDrawMode(map) {
                return new L.Draw.Marker(map, drawControl.options.draw.marker);
            }

            function initGeomEditMode(map) {
                return new L.EditToolbar.Edit(map, {
                    featureGroup: drawControl.options.edit.featureGroup
                });
            }

            function initBboxSearchMode(map) {
                return new L.Draw.Rectangle(map, drawControl.options.draw.rectangle);
            }

            function returnLayerBack(layer) {
                drawnItems.clearLayers();
                markerClusters.removeLayer(entryLayer);
                entryLayer.addData(layer);
                markerClusters.addLayer(entryLayer);
            }

            function removeMarkerFromLayer(id) {
                mapHelpers.findInMapLayerAndRemove(id, entryLayer);
                mapHelpers.findInMapLayerAndRemove(id, markerClusters);
            }

            function redrawEntryLayer() {
                markerClusters.removeLayer(entryLayer);
                markerClusters.addLayer(entryLayer);
            }

            function refreshMapData(model) {
                redrawMap(model);
                entryLayer.clearLayers();
                angular.element("#feature-list").find("tbody").empty();
            }

            function redrawMap(model, bbox) {
                bbox = (bbox !== undefined) ? bbox : '';
                markerClusters.removeLayer(entryLayer);
                entryLayer.clearLayers();
                getEntryJSON(model, bbox);
            }

            function getEntryJSON(username, model, id) {
                var deferred = $q.defer();
                var url = mapHelpers.getParametersUrl("/api/geomodel/" + username +'/'+ model);
                if (service.modelLayerUrl !== url) {
                    service.map.removeLayer(entryLayer);
                    //clearAllLayer();
                    markerClusters.clearLayers();
                    entryLayer.clearLayers();
                    if (model) {
                        $http.get(url)
                            .success(function (data) {
                                entryLayer.addData(data);
                                markerClusters.addLayer(entryLayer);
                                if (data.region) {
                                    regionLayer.clearLayers();
                                    var multiPolygon = {
                                        "type": "Feature",
                                        "properties": {},
                                        "geometry": JSON.parse(data.region)
                                    };
                                    regionLayer.addData(multiPolygon);
                                }
                                if (data.features.length) {
                                    if (id) {
                                    //icon selection moved to entries service
                                    }
                                    else if (withExtend) {
                                        renderEntry();
                                    }
                                    withExtend = true;
                                    modalService.progressbar.hide();
                                }
                                service.modelLayerUrl = url;
                                deferred.resolve();
                            })
                            .catch(function () {
                                modalService.progressbar.hide();
                                deferred.reject();
                            });
                    }
                    else {
                        deferred.reject();
                    }
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function renderEntry() {
                if (regionLayer.getLayers().length) {
                    service.map.fitBounds(regionLayer.getBounds());
                }
                else if (entryLayer.getBounds() && entryLayer.getBounds()._northEast !==undefined) {
                    service.map.fitBounds(entryLayer.getBounds());
                }
            }
            var regionSearch = {
                onClick: function (e) {
                    var latlng = e.latlng;
                    var zoomlevel = map.getZoom();
                    var query = '?in_region=' + latlng.lat + ',' + latlng.lng + ',' + zoomlevel;
                    angular.element('#map').css('cursor', mapcursor);
                    $location.path('/' + query);

                },
                enable: function () {
                    map.on('click', this.onClick);
                },
                disable: function () {
                    map.off('click', this.onClick);
                    angular.element('#map').css('cursor', mapcursor);
                },
                once: function () {
                    var $map = angular.element('#map');
                    mapcursor = $map.css('cursor');
                    $map.css('cursor', 'crosshair');
                    map.once('click', this.onClick);
                }

            };

            function getAddressExampleFromMap(layer) {
                addressExampleItems.clearLayers();
                var url = "/osm/map_address/" + layer.getLatLng().lat + "/" + layer.getLatLng().lng + "/";
                $http.get(url)
                    .then(function (resp) {
                        var data = resp.data;
                        if (data[0].features && data[0].features.length) {
                            mapHelpers.applyScope('id_geom', {'autofill': data[0].features[0]});
                        }
                        addressExampleItems.addData(data);
                    });
                }

            function ifMap(f) {
                return function () {
                    if (service.map) {
                        f();
                    }
                };
            }

            var service = {
                map: null,
                modelLayerUrl: null,
                drawMode: null,
                geomEditMode: null,
                bboxSearchMode: null,
                drawControl: drawControl,
                entryLayer: entryLayer,
                drawnItems: drawnItems,
                regionLayer: regionLayer,
                markerClusters: markerClusters,
                sidebar: null,
                sidebar_is_narrow: false,
                setActiveArea: function(options) {
                    options = options || activeAreaOptions;
                    service.map.setActiveArea(options);
                },
                showFullExtent: function() {
                    service.map.fitBounds(service.entryLayer.getBounds());
                },
                redrawMap: function(bbox) {
                    redrawMap(bbox);
                },
                disableDraw: function () {
                    ifMap(service.drawMode.disable)();
                },
                disableEdit: function () {
                    ifMap(service.geomEditMode.disable)();
                },
                returnLayerBack: function (layer) {
                    returnLayerBack(layer);
                },
                redrawEntryLayer: function() {
                    redrawEntryLayer();
                },
                removeMarkerFromLayer: function(id) {
                    removeMarkerFromLayer(id);
                },
                clearDrawItems: function () {
                    if (service.map.hasLayer(drawnItems)) {
                        service.drawnItems.clearLayers();
                    }
                },
                clearRegionLayer: function () {
                    if (service.map.hasLayer(regionLayer)) {
                        service.regionLayer.clearLayers();
                    }
                },
                clearAllLayer: function() {
                    clearAllLayer();
                },
                clickToLayer: function(layer) {
                    clickToLayer(layer);
                },
                sidebarClick: function (id) {
                    sidebarClick(id);
                },
                showSidebar: function() {
                    service.sidebar.show();
                },
                hideSidebar: function() {
                    service.sidebar.hide();
                },
                toggleSidebar: function() {
                    service.sidebar.toggle();
                },
                checkSidebarIsNarrow: function() {
                    service.sidebar_is_narrow = checkSidebarIsNarrow();
                    return service.sidebar_is_narrow;
                },
                getEntryJSON: function (username, model, id) {
                    var deferred = $q.defer();
                    getEntryJSON(username, model, id).then(function() {
                            deferred.resolve();
                        }).catch(deferred.reject);
                    return deferred.promise;
                },
                init: function (id) {
                    service.map = L.map(id, mapOptions);
                    var map = service.map;
                    map.fitBounds([
                        [35, 0],
                        [76, 180]
                    ]);
                    service.drawMode = initDrawMode(map);
                    service.geomEditMode = initGeomEditMode(map);
                    service.bboxSearchMode = initBboxSearchMode(map);
                    service.sidebar = setSidebar();
                    service.sidebar.addTo(map);

                    map.on("click", function (e) {
                        if ($window.innerWidth <= 767) {
                            service.sidebar.hide();
                        }
                    });
                    map.on('draw:created', function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            var layer = e.layer;
                            mapHelpers.applyScope('id_geom', {
                                'geom': mapHelpers.toWKT(layer),
                                'drawNewMarkerMode': false,
                                'entry.coordinates': layer.getLatLng().lat.toFixed(4) + " " + layer.getLatLng().lng.toFixed(4)
                            });
                            drawnItems.addLayer(layer);
                            //getAddressExampleFromMap(layer);
                        }
                        else if (service.bboxSearchMode.enabled()) {
                            var layerBounds = e.layer.getBounds();
                            var southWest = layerBounds._southWest;
                            var northEast = layerBounds._northEast;
                            var bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
                            bbox = '?in_bbox=' + bbox.join(',');
                            getEntries();
                            if (Entries) {
                                $window.location.href = '#/'+Entries.username +'/layer/'+ Entries.model + bbox;
                            }
                        }
                    });
                    map.on('draw:edited', function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            var layers = e.layers;
                            layers.eachLayer(function (layer) {
                                getAddressExampleFromMap(layer);
                                mapHelpers.applyScope('id_geom', {
                                    'geom': mapHelpers.toWKT(layer),
                                    'entry.coordinates': layer.getLatLng().lat.toFixed(4) + " " + layer.getLatLng().lng.toFixed(4)
                                });
                            });
                        }
                    });
                    map.on("draw:drawstop", function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            mapHelpers.applyScope('id_geom', {'drawNewMarkerMode': false});
                        }
                    });

                    L.control.attribution({
                            position: 'bottomright',
                            prefix: ''
                        }).addTo(map);

                    L.control.zoom({
                        position: "bottomright"
                    }).addTo(map);

                    var baseLayers = {
                        "Карта": entryOSM,
                        "Спутник": Esri_WorldImagery
                        //"Гибрид": mapquestHYB
                    };

                    var groupedOverlays = {};

                    groupedOverlays[mapDefaults.EntryOverlaysHtml] = markerClusters;
                    L.control.layers(baseLayers, groupedOverlays, {
                        collapsed: isTight()
                    }).addTo(map);

                    var sidebar = service.sidebar;
                    if (!isTight()) {
                        sidebar.show();
                    }
                    getViewport();
                    service.sidebar.on("shown", function () {
                        getViewport();
                    }).on("hidden", function () {
                        getViewport();
                    });
                    service.sidebar_is_narrow = checkSidebarIsNarrow();
                }
            };
            return service;
        }]);