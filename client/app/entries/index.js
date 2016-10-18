angular.module('entries', ['entries.list', 'entries.detail', 'entries.factory','entries.dynamit'])

.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'entries/manager/templates/sidebar.html',
            controller: 'DynamitListCtrl'
        })
        .when('/:username/layer/:model', {
            templateUrl: 'entries/sidebar.html',
            controller: 'EntryListCtrl'
        })
        .when('/:username/layer/:model/create', {
            templateUrl: 'entries/detail/templates/detail.html',
            controller: 'EntryDetailCtrl'
        })
        .when('/:username/layer/:model/:id', {
            templateUrl: 'entries/detail/templates/detail.html',
            controller: 'EntryDetailCtrl'
        });
}])

.run(['$rootScope', '$routeParams','appConf','Entries', 'emap', 'mapDefaults',
        function ($rootScope, $routeParams, appConf, Entries, emap, mapDefaults) {
    $rootScope.$on("$locationChangeSuccess", function (event, next, current) {
        emap.disableDraw();
        emap.disableEdit();
        if (Entries.entryToUpdate && Entries.entries.length !== 0) {
            var data = Entries.entryToUpdate;
            for (var fry = 0; fry < Entries.entries.length; fry++) {
                if (Entries.entries[fry].id === data.id) {
                    data.entryListName = Entries.entryListName(data);
                    Entries.entries[fry] = data;
                    break;
                }
            }
        }
        if (Entries.entriesLayerToReturn) {
            emap.returnLayerBack(Entries.entriesLayerToReturn);
            Entries.entriesLayerToReturn = null;
        }
        if (Entries.entryIcoToReturn) {
            Entries.entryIcoToReturn.setIcon(mapDefaults.singleIcon);
        }
        //addressExampleItems.clearLayers();
        emap.clearDrawItems();
        //highlight.clearLayers();
        var queryType = null;
        var _getParamInQuery = function (from_query_str) {
            for (var fry in Entries.queryParam) {
                if (Entries.queryParam.hasOwnProperty(fry)) {
                    var urlParam = appConf.getUrlParameters(fry, from_query_str, true);
                    if (urlParam) {
                        queryType = fry;
                        return urlParam;
                    }
                }
            }
            return null;
        };
        var currentQuery = _getParamInQuery(current);
        var nextQuery = _getParamInQuery(next);
        for (var q in Entries.queryParam) {
            if (Entries.queryParam.hasOwnProperty(q)) {
                if (currentQuery && nextQuery == null) {
                    Entries.queryParam[q] = null;
                }
                else if (q === queryType) {
                    Entries.queryParam[q] = nextQuery ? nextQuery : currentQuery;
                }
                else {
                    Entries.queryParam[q] = null;
                }
            }
        }
        if ((nextQuery || currentQuery) && (nextQuery !== currentQuery)) {
            Entries.entries = [];
            if (!emap.map.hasLayer(emap.markerClusters)) {
                emap.map.addLayer(emap.markerClusters);
            }
            //angular.element("#loading").show();
            emap.clearRegionLayer();
            emap.markerClusters._unspiderfy();
            //emap.redrawMap(Entries.model);
        }
    });
}]);
