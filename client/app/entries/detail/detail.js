angular.module('entries.detail', ['entries.print', 'entries.comment', 'entries.gallery'])

    .controller('EntryDetailCtrl', ["$scope", "$routeParams", "$controller", "Entries", "api", "appConf", "emap", "mapDefaults", "mapHelpers", "entries.comment",
        function ($scope, $routeParams, $controller, Entries, api, appConf, emap, mapDefaults, mapHelpers, comments) {
            $scope.editmode = false;
            $scope.geom = null;

            $scope.entryDetail = function () {
                Entries.setModel($routeParams.username, $routeParams.model, $routeParams.id).then(function (meta) {
                    $scope.entryMeta = meta;
                    if ($routeParams.id) {
                        $scope.entry = {'id': $routeParams.id};
                        Entries.get($routeParams.username, $routeParams.model, $routeParams.id).then(function (data) {
                            $scope.entry = data;
                            $scope.entryMeta = Entries.meta;
                            $scope.entry_bkp = angular.copy($scope.entry);
                            if (Entries.editmode) {
                                $scope.startEdit();
                                Entries.editmode = false;
                            }
                            $scope.entry_bkp = angular.copy($scope.entry);
                        });
                    }
                    else {
                        $scope.entry = {};
                        $scope.editmode = true;
                        $scope.createmode = true;
                    }
                });
            };
            $scope.entryDetail();
            $scope.brothers = null;
            $scope.num_in_cluster = null;
            $scope.$watchCollection('brothers', function (newVal, oldVal) {
                if (newVal && newVal.length > 1) {
                    for (var fry = 0; fry < newVal.length; fry++) {
                        if (newVal[fry] === $routeParams.id) {
                            $scope.previous = (fry !== 0) ? newVal[fry - 1] : newVal[newVal.length - 1];
                            $scope.next = (fry < newVal.length - 1) ? newVal[fry + 1] : newVal[0];
                            $scope.num_in_cluster = fry + 1;
                        }
                    }
                }
            });
            $scope.deleteEntry = function (id) {
                Entries.deleteEntry(id).then(function () {
                    emap.drawnItems.clearLayers();
                    appConf.backToList(Entries.model);
                });
            };
            //TODO: перенести в сервис Print
            $scope.uploadEntry = function (id) {
                //mapHelpers.applyScope('map', {'entryForExport': $scope.entry});
                //angular.element('#printModal').modal('show');
                //var preload = document.createElement("button");
                //preload.className = 'btn btn-default pull-right';
                //preload.innerHTML = "Идёт подготовка изображения";
                //preload.disabled = true;
                //document.getElementById('saveimg').innerHTML = '';
                //document.getElementById('saveimg').appendChild(preload);
                //document.getElementById('printmap-container').innerHTML = "<div id='printmap'></div>";
                //setTimeout(function() {
                //   createPrintMap(id);
                //}, 1000);
            };
            $scope.createComment = function (c, id) {
                comments.createComment(c, id).then(
                    $scope.comment = ''
                );
            };
        }])

    .directive('entryAttr', ['$http', 'api', 'Entries', 'emap', 'mapDefaults', 'mapHelpers', 'appConf', 'Notification',
        function ($http, api, Entries, emap, mapDefaults, mapHelpers, appConf, Notification) {
            return {
                restrict: 'A',
                replace: true,
                transclude: false,
                templateUrl: 'entries/detail/templates/form/form.html',
                controller: ['$scope', function ($scope) {
                    $scope.createOrUpdate = function () {
                        if ($scope.createmode) {
                            $scope.createEntry();
                        }
                        else if ($scope.editmode) {
                            $scope.updateEntry();
                        }
                    };
                    $scope.createEntry = function () {
                        $scope.errors = {};
                        var data = $scope.entry;
                        $scope.entry.geom = $scope.geom;
                        Entries.create(data).then(function (data) {
                            drawEntryFromResponseData(data);
                            appConf.goToDetail(Entries.username, Entries.model, data.id);
                            Notification.success("Объект добавлен");
                        }).catch(function (error) {
                            returnError(error);
                        });
                    };
                    $scope.updateEntry = function () {
                        $scope.errors = {};
                        cancelEntryMarkerEdit();
                        var data = $scope.entry;
                        $scope.entry.geom = $scope.geom;
                        Entries.update($scope.entry.id, data).then(function (data) {
                            updateEntryFromRespData(data);
                            drawEntryFromResponseData(data);
                            Notification.success("Объект " + data.entryid + " обновлён");
                            $scope.editmode = false;
                            $scope.entry_bkp = angular.copy($scope.entry);
                            Entries.entryToUpdate = $scope.entry;
                        }).catch(function (error) {
                            returnError(error);
                        });
                    };
                    function returnError(error) {
                        Notification.error("<strong>Ошибка при заполнении формы</strong>");
                        var firstErrorField = null;
                        var timeout = 0;
                        angular.forEach(error.data, function (errors, field) {
                            if (!firstErrorField) {
                                firstErrorField = field;
                            }
                            if ($scope.entryForm['entryFieldForm-' + field]) {
                                $scope.entryForm['entryFieldForm-' + field].entryFieldForm[field].$setValidity('server', false);
                                for (var fry = 0; fry < $scope.panels.length; fry++) {
                                    for (var f = 0; f < $scope.panels[fry].fields.length; f++) {
                                        if ($scope.panels[fry].fields[f] === field) {
                                            if ($scope.panels[fry].collapsed) {
                                                $scope.collapseToggle($scope.panels[fry]);
                                                timeout = 1000;
                                            }
                                        }
                                    }
                                }
                            }
//                    $scope.errors[field] = errors.join(', ');
                        });
                        if (firstErrorField) {
                            var $invalidInput;
                            var $sidebarBody = angular.element('.sidebar-body');
                            angular.forEach($sidebarBody.find('input'), function (node) {
                                if (node.name === firstErrorField) {
                                    $invalidInput = angular.element("input[name=" + node.name + "]");
                                }
                            });
                            if ($invalidInput) {
                                setTimeout(function () {
                                    $sidebarBody.scrollTop($sidebarBody.scrollTop() + $invalidInput.position().top - 5);
                                }, timeout);
                            }
                        }
                    }

                    function updateEntryFromRespData(data) {
                        for (var d in data) {
                            if (data.hasOwnProperty(d)) {
                                if ($scope.entry.hasOwnProperty(d)) {
                                    if ($scope.entry[d] !== data[d]) {
                                        $scope.entry[d] = data[d];
                                    }
                                }
                            }
                        }
                    }

                    function drawEntryFromResponseData(data) {
                        if (emap.drawnItems.getLayers()[0] !== undefined) {
                            emap.drawnItems.clearLayers();
                            emap.entryLayer.addData(mapHelpers.createGeoJsonEntry(data.id, data.geom));
                            var layer = mapHelpers.findInMapLayer(data.id, emap.entryLayer);
                            Entries.entryIcoToReturn = layer;
                            layer.setIcon(mapDefaults.singleCurrentIcon);
                            emap.redrawEntryLayer();
                        }
                    }

                    $scope.drawNewMarkerMode = emap.drawMode.enabled();
                    $scope.drawNewEntryMarker = function () {
                        if (!emap.drawMode.enabled()) {
                            emap.drawnItems.clearLayers();
                            emap.drawMode.enable();
                        }
                        else {
                            emap.drawMode.disable();
                        }
                        $scope.drawNewMarkerMode = emap.drawMode.enabled();
                        angular.element('.btn').blur();
                    };
                    $scope.toggleEdit = function (id) {
                        if (!$scope.editmode) {
                            $scope.startEdit(id);
                        }
                        else {
                            $scope.cancelEditing();
                        }
                    };
                    $scope.startEdit = function (id) {
                        $scope.editmode = true;
                        var existGeom = mapHelpers.findInMapLayerAndRemove($scope.entry.id, emap.entryLayer);
                        if (existGeom) {
                            emap.removeMarkerFromLayer($scope.entry.id);
                            $scope.geom = $scope.entry.geom;
                            existGeom.setIcon(mapDefaults.singleCurrentIcon).setZIndexOffset(20);
                            emap.drawnItems.addLayer(existGeom);
                            Entries.entriesLayerToReturn = emap.drawnItems.getLayers()[0].toGeoJSON();
                        }
                    };
                    $scope.cancelEditing = function () {
                        if ($scope.createmode) {
                            appConf.goToEntry(Entries.model);
                        }
                        else {
                            $scope.entry = angular.copy($scope.entry_bkp);
                            $scope.editmode = false;
                            if (Entries.entriesLayerToReturn) {
                                var layer = Entries.entriesLayerToReturn;
                                emap.returnLayerBack(layer);
                                Entries.entriesLayerToReturn = null;
                                layer = mapHelpers.findInMapLayer($scope.entry.id, emap.markerClusters);
                                Entries.entryIcoToReturn = layer;
                                layer.setIcon(mapDefaults.singleCurrentIcon);
                                emap.clickToLayer(layer);
                                cancelEntryMarkerEdit();
                            }
                        }
                    };
                    $scope.geomEditMode = emap.geomEditMode.enabled();
                    $scope.triggerEntryMarkerEdit = function () {
                        if (emap.geomEditMode.enabled()) {
                            cancelEntryMarkerEdit();
                        }
                        else {
                            emap.geomEditMode.enable();
                            $scope.geomEditMode = true;
                        }
                        angular.element('.btn').blur();
                    };
                    function cancelEntryMarkerEdit() {
                        emap.geomEditMode.save();
                        emap.geomEditMode.disable();
                        $scope.geomEditMode = false;
                    }

                    $scope.getGeometryFromCoordInput = function (e) {
                        if (e.coordinates) {
                            emap.drawnItems.clearLayers();
                            emap.drawMode.disable();
                            var coord, x, y,
                                reDd = /^(-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6})[, ]*(-?([1]?[0-7][0-9]|[1]?[0-8][0]|[1-9]?[0-9])\.{1}\d{1,6})$/,
                                reGgMmSs = /^(-?(90[ :°d]*00[ :\'\'m]*00(\.0+)?|[0-8][0-9][ :°d]*[0-5][0-9][ :\'\'m]*[0-5][0-9](\.\d+)?)[ :\?\"s]*(N|n|S|s|[с,ю]\.?ш\.?)?)[ ,]*(-?(180[ :°d]*00[ :\'\'m]*00(\.0+)?|([1]?[0-7][1-9]|[1]?[1-8][0]|[1-9]?[0-9])[ :°d]*[0-5][0-9][ :\'\'m]*[0-5][0-9](\.\d+)?)[ :\?\"s]*(E|e|W|w|[з,в]\.?д\.?)?)$/;
                            if (reDd.exec(e.coordinates)) {
                                coord = reDd.exec(e.coordinates);
                                x = coord[1];
                                y = coord[3];
                            }
                            else if (reGgMmSs.exec(e.coordinates)) {
                                coord = reGgMmSs.exec(e.coordinates);
                                var lat = coord[2].split(" ");
                                var lng = coord[7].split(" ");
                                x = lat[0] * 1 + (lat[1] / 60) + (lat[2] / 3600);
                                y = lng[0] * 1 + (lng[1] / 60) + (lng[2] / 3600);

                            }
                            if (x && y) {
                                var xyMarker = L.marker([x, y]).setIcon(mapDefaults.singleCurrentIcon);
                                emap.drawnItems.addLayer(xyMarker);
                                map.panTo(xyMarker.getLatLng());
                                $scope.geom = e.geom = mapHelpers.toWKT(xyMarker);
                            }
                        }
                    };
                }],
                link: function (scope, element, attrs) {
                    Entries.getPanels().then(function (panels) {
                        scope.panels = panels;
                    });
                    scope.entryAddr = {};
                    scope.is_collapsed = function (panel) {
                        return Entries.panel_collapsed[panel.id] !== undefined ? Entries.panel_collapsed[panel.id] : panel.collapsed;
                    };
                    scope.collapseToggle = function (panel) {
                        Entries.panel_collapsed[panel.id] = panel.collapsed = !panel.collapsed;
                        angular.element('#collapse' + panel.id).collapse('toggle');
                    };
                    scope.addressAutocomplate = function (val, field, panel) {
                        scope.entry[field] = val;
                        var code = '';
                        if (scope.entry.code && panel.widget) {
                            var addrIndex = panel.widget.indexOf(field);
                            if (addrIndex >= 0) {
                                for (var fry = 0; fry < addrIndex; fry++) {
                                    if (scope.entryAddr[panel.widget[fry]]) {
                                        code = scope.entry.code;
                                        break;
                                    }
                                }
                            }
                        }
                        return $http.get('/entry/addr_autocomplete/', {
                            params: {
                                q: val,
                                field: field,
                                code: code,
                                regioncode: scope.entryAddr.regioncode
                            }
                        }).then(function (response) {
                            if (response.data) {
                                return response.data.map(function (item) {
                                    return item;
                                });
                            }
                            return {};
                        });
                    };
                    scope.formatAddr = function ($model, field) {
                        if ($model !== undefined && $model['full_name']) {
                            if (field === 'regioncode') {
                                return $model[field];
                            }
                            else {
                                return $model['full_name'];
                            }
                        } else {
                            return $model;
                        }
                    };
                    scope.onAddressSelect = function ($item, $model, $label, field, panel) {
                        if (panel.widget) {
                            //  TODO: заменить "-2" которое исключает поля geom и latlng
                            for (var fry = 0; fry < panel.fields.length - 2; fry++) {
                                if (panel.fields[fry] !== field) {
                                    scope['entryAddr'][panel.fields[fry]] = scope.entry[panel.fields[fry]] = '';
                                }
                            }
                        }
                        if (field === 'regioncode') {
                            scope.entry[field] = $item.regioncode;
                        }
                        if (field === 'code') {
                            scope.entryAddr[$item.field] = $item;
                            scope.entry[$item.field] = $item['full_name'];
                        }
                        scope.entry.okato = $item.okato;
                        scope.entry.postalcode = $item.postalcode;
                        scope.entryAddr.code = scope.entry.code = $item.code;
                        scope.entryAddr.regioncode = scope.entry.regioncode = $item.regioncode;
                        scope.getAddrParentsAutocomplete($item.parents);
                    };
                    scope.getAddrParentsAutocomplete = function (data) {
                        if (data && data.length) {
                            for (var fry = 0; fry < data.length; fry++) {
                                if (data[fry].hasOwnProperty('field')) {
                                    scope.entryAddr[data[fry]['field']] = data[fry]['full_name'];
                                    scope.entry[data[fry]['field']] = data[fry]['full_name'];
                                }
                            }
                        }
                    };
                    scope.getTypeheadTemplate = function (field) {
                        var path = 'entries/detail/templates/form-widget';
                        var template = 'addr-input-autocomplete.html';
                        switch (field) {
                            case 'regioncode':
                                template = 'addr-input-auto-regioncode.html';
                                break;
                            case 'code':
                                template = 'addr-input-auto-code.html';
                                break;
                        }
                        return path + template;
                    };
                    scope.getTypeheadMinLength = function (field) {
                        if (field === 'regioncode') {
                            return 1;
                        }
                        return 2;
                    };
                }
            };
        }])

    .directive("inputControl", ['$compile', '$http', '$templateCache', function ($compile, $http) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element) {
                scope.getInputUrl = function () {
                    var html_template;
                    if (scope.panel['custom_edit_template'] && scope.panel.custom_edit_template[scope.field]) {
                        html_template = scope.panel.custom_edit_template[scope.field];
                    }
                    else if (scope.panel.widget && scope.panel.widget.indexOf(scope.field) > -1) {
                        html_template = 'typeahead-input.html';
                    }
                    else {
                        var field_type;
                        html_template = 'input.html';
                        switch (scope.entryMeta[scope.field]['type']) {
                            case 'integer':
                                field_type = 'number';
                                break;
                            case 'boolean':
                                field_type = 'checkbox';
                                html_template = 'check-box-input.html';
                                break;
                            case 'email':
                                field_type = 'email';
                                break;
                            case 'date':
                                html_template = 'date-input.html';
                                scope.open = function ($event) {
                                    $event.preventDefault();
                                    $event.stopPropagation();
                                    scope.opened = true;
                                };
                                scope.formatDate = function () {
                                    var date = new Date(scope.entry[scope.field]);
                                    scope.entry[scope.field] = [date.getFullYear(),date.getMonth(),date.getDay()].join('-');
                                };
                                scope.dateOptions = {
                                    formatYear: 'yy',
                                    startingDay: 1
                                };
                                scope.format = 'yyyy-MM-dd';
                                break;
                            default:
                                field_type = 'text';
                        }
                        scope.type = field_type;
                    }
                    scope.required = scope.entryMeta[scope.field]['required'];
                    scope.max_length = scope.entryMeta[scope.field]['max_length'];

                    return 'entries/detail/templates/form/fields/' + html_template;
                };
            },
            template: '<div ng-include="getInputUrl()"></div>'
        };
    }]);

