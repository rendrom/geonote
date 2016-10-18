angular.module('entries.factory', [])

.factory('Entries', ['$q','api','appConf','NAMES','modalService','emap','mapHelpers','mapDefaults','Notification',
           function ( $q , api , appConf , NAMES , modalService , emap , mapHelpers , mapDefaults , Notification) {
        function getEntryOptions (id) {
            var deferred = $q.defer();
            if (!service.meta) {
                api.entry_large.get_meta({id: id, username: service.username, model:service.model}).$promise.then(function (meta) {
                    service.meta = meta.actions;
                    service.dynamit = meta.dynamit;
                    service.panels = meta.panels;
                    service.baseEntryCount = meta.entry_count;
                    deferred.resolve(meta);
                }).catch(deferred.reject);
            }
            else {
                deferred.resolve(service.meta);
            }
            return deferred.promise;
        }
        var defaultOptions = {
            model: null,
            username: null,
            meta: null,
            dynamit: null,
            panels: null,
            previousEntry: null,
            baseEntryCount: undefined,
            queryEntryCount: undefined,
            entries: [],
            nextPage: null,
            entriesLayerToReturn: null,
            entryIcoToReturn: null,
            entryToUpdate: null,
            panel_collapsed: {},
            queryParam: {
                in_bbox: null,
                in_region: null
            }
        };
        function refresh () {
            for (var fry in defaultOptions){
                if (defaultOptions.hasOwnProperty(fry) && service.hasOwnProperty(fry)) {
                    service[fry] = defaultOptions[fry];
                }
            }
        }
        var service = {};
        angular.extend(service, defaultOptions);
        angular.extend(service, {
            setModel: function(username, model, id) {
                var deferred = $q.defer();
                if (model !== service.model) {
                    modalService.progressbar.show();
                    refresh();
                    service.model = model;
                    service.username = username;
                    getEntryOptions().then(function(meta) {
                        modalService.progressbar.hide();
                        NAMES.title = meta.title.verbose_name;
                    }).catch(function () {
                        appConf.goToMainPage();
                    });
                }
                emap.getEntryJSON(username, model, id).then(function() {
                    deferred.resolve(service.meta);
                });
                return deferred.promise;
            },
            cleanAll: function() {
                refresh();
                emap.modelLayerUrl = '';
                emap.getEntryJSON();
            },
            getPanels: function() {
                var deferred = $q.defer();
                if (!service.panels) {
                    getEntryOptions().then(function(meta) {
                        deferred.resolve(meta.panels);
                    }).catch(deferred.reject);
                }
                else {
                    deferred.resolve(service.panels);
                }
                return deferred.promise;
            },
            getEntries: function() {
                var deferred = $q.defer();
                if (service.entries.length === 0) {
                    var queryParam = {};
                    for (var fry in service.queryParam) {
                        if (service.queryParam.hasOwnProperty(fry)) {
                            queryParam[fry] = service.queryParam[fry];
                        }
                    }
                    queryParam['username'] = service.username;
                    queryParam['model'] = service.model;
                    api.entry.query(queryParam).$promise.then(function (data) {
                        service.nextPage = data.next;
                        service.queryEntryCount = data.count;
                        service.baseEntryCount = data.count > service.baseEntryCount ? data.count : service.baseEntryCount;
                        service.entries = data.results;
                        angular.forEach(service.entries, function (item) {
                            item.entryListName = service.entryListName(item);
                        });
                        deferred.resolve();
                    }).catch(deferred.reject);
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            },
            getEntriesOptions: function() {
                var deferred = $q.defer();
                api.entry.get_meta({model:service.model}).$promise.then(function (data) {
                    deferred.resolve();
                }).catch(deferred.reject);
                return deferred.promise;
            },
            get: function(username, model, id) {
                var deferred = $q.defer();
                api.entry_large.get({id: id, model: model, username: username }).$promise.then(function (data) {
                    service.previousEntry = data;
                    emap.sidebarClick(data.id);
                    if (data.geom) {
                        if (data.geom.type === 'Point') {
                            data.coordinates = data.geom.coordinates[1].toFixed(4) + ' ' + data.geom.coordinates[0].toFixed(4);

                            var selectedIco = mapHelpers.findInMapLayer(data.id, emap.markerClusters);
                            if (selectedIco) {
                                selectedIco.setIcon(mapDefaults.singleCurrentIcon);
                                service.entryIcoToReturn = selectedIco;
                            }
                        }
                    }
                    deferred.resolve(data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            create: function(data) {
                var deferred = $q.defer();
                api.entry_large.create({model: service.model, username: service.username}, data).$promise.then(function (data) {
                    if (service.entries.length !== 0) {
                        service.entries.unshift(data);
                        data.entryListName = service.entryListName(data);
                    }
                    deferred.resolve(data);
                }).catch(function (error) { deferred.reject(error);});
                return deferred.promise;
            },
            update: function(id, data) {
                var deferred = $q.defer();
                api.entry_large.update({id:id, model:service.model, username: service.username}, data).$promise.then(function (data) {
                    service.entriesLayerToReturn = null;
                    deferred.resolve(data);
                }).catch(function (error) { deferred.reject(error);});
                return deferred.promise;
            },
            deleteEntry: function (id, name) {
                var deferred = $q.defer();
                var bodyText = !name ? '' : 'Вы действительно хотите удалить ' +  NAMES.entry.name +': '+name+'?';
                modalService.showConfirm(bodyText)
                    .then(function (result) {
                    api.entry_large.delete({id: id, model:service.model, username: service.username}).$promise.then(function () {
                        service.entriesLayerToReturn = null;
                        service.entryIcoToReturn = null;
                        if (service.entries.length !== 0) {
                            service.entries.splice(appConf.getElementIndex(id, service.entries), 1);
                        }
                        emap.removeMarkerFromLayer(id);
                        Notification.success("Объект удалён");
                        deferred.resolve();
                    }).catch(deferred.reject);
                });
                return deferred.promise;
            },
            entryListName :  function(entry) {
                var first_part = '';
                if (NAMES.entry.short_name) {
                    first_part = NAMES.entry.short_name +': ';
                }
                var nameForListItem;
                if (entry.entryid) {
                    nameForListItem =  first_part + entry.entryid;
                }
                else {
                    nameForListItem =  first_part + entry.id;
                }
                return nameForListItem;
            }
        });
        return service;
    }]);

