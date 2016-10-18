angular.module('entries.list', [])

.controller('EntryListCtrl', ["$scope","$routeParams","$http","Entries",
                     function( $scope , $routeParams , $http , Entries ) {
        Entries.setModel($routeParams.username, $routeParams.model);
        $scope.loadingBtn = {
                btn: angular.element('.show-more-btn'),
                loading: function() {
                    this.btn.button('loading');
                },
                reset: function() {
                    this.btn.button('reset');
                }
            };
        $scope.init = function () {
            $scope.loadingBtn.loading();
            Entries.getEntries().then(function(){
                $scope.entries = Entries.entries;
                $scope.nextPage = Entries.nextPage;
            });
            if (Entries.previousEntry) {
                setTimeout(function () {
                    var $sidebarBody = angular.element('.sidebar-body');
                    var $elem = angular.element('#entry-' + Entries.previousEntry.id);
                    if ($elem.length > 0) {
                        $sidebarBody.scrollTop($sidebarBody.scrollTop() + $elem.position().top - 5);
                        $elem.addClass('previous-entry');
                        Entries.previousEntry = null;
                    }
                }, 1);
            }
            $scope.loadingBtn.reset();
        };
        $scope.init();
        $scope.nextPage = Entries.nextPage ? Entries.nextPage: null;
        $scope.showMore = function() {
            if ($scope.nextPage) {
                $scope.loadingBtn.loading();
                $http.get($scope.nextPage)
                    .then(function (res) {
                        var data = res.data;
                        Entries.nextPage = $scope.nextPage = data.next;
                        angular.forEach(data.results, function (item) {
                            item.entryListName = Entries.entryListName(item);
                            $scope.entries.push(item);
                        });
                        Entries.entries = $scope.entries;
                        $scope.loadingBtn.reset();
                    });
            }
        };
    }])

.directive("entriesList", [function() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'entries/list/templates/entries-list.html'
    };
}])

.directive("entryInList", ["Entries","appConf", function(Entries, appConf) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'entries/list/templates/entry-in-list.html',
        link: function(scope, element) {
            scope.deleteEntry = function(id, entryid){
                Entries.deleteEntry(id, entryid);
            };
            scope.startEdit = function(id) {
                Entries.editmode = true;
                appConf.goToDetail(Entries.username, Entries.model, id);
            };
        }
    };
}]);
