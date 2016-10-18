angular.module('app', [
    'ngCookies',
    'ngTouch',
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'templates.app',
    'ui-notification',
    'ui.sortable',
    'angularFileUpload',
    'angular-carousel',

    'app-common',
    'entries'
]);

angular.module('app').controller('AppController',
    ['$window', '$scope', '$location', 'auth', 'Entries', 'NAMES', 'appConf', 'emap', 'modalService',
    function ($window, $scope, $location, auth, Entries, NAMES, appConf, emap, modalService) {
        $scope.auth = auth;
        $scope.Entries = Entries;

        $scope.NAMES = NAMES;

        $scope.showOnTheMap = function (id) {
            emap.sidebarClick(id);
        };
        $scope.bboxSearchMode = function () {
            if (emap.bboxSearchMode.enabled()) {
                emap.bboxSearchMode.disable();
            }
            else {
                emap.bboxSearchMode.enable();
            }
        };
        $scope.goToMainPage = function () {
            appConf.goToMainPage();
        };
        $scope.backToList = function () {
            appConf.backToList(Entries.username, Entries.model);
        };
        $scope.cleanSelection = function () {
            appConf.cleanSelection(Entries.username, Entries.model);
        };
        $scope.goToDetail = function (id) {
            appConf.goToDetail(Entries.username, Entries.model, id);
        };
        $scope.goToCreatePage = function () {
            $location.path(Entries.username + '/layer/' + Entries.model + '/create');
        };
        $scope.showSidebar = function () {
            emap.showSidebar();
        };
        $scope.hideSidebar = function () {
            emap.hideSidebar();
        };
        $scope.toggleSidebar = function () {
            emap.toggleSidebar();
        };
        $scope.showFullExtent = function () {
            emap.showFullExtent();
        };
        $scope.is_filter = false;
        //TODO: перенести в сервис. Избавиться от $watchCollection
        $scope.$watchCollection('Entries.queryParam', function (newVal, oldVal) {
            var has_filter = false;
            for (var fry in Entries.queryParam) {
                if (Entries.queryParam.hasOwnProperty(fry)) {
                    if (Entries.queryParam[fry]) {
                        $scope.is_filter = has_filter = true;
                        break;
                    }
                }
            }
            $scope.is_filter = has_filter;
        });
        /**
         is_narrow - показывает статус боковой панели. Может быть широкой(false) или узкой(true)
         нелинейно зависит ош ширины окна браузера
         */
        $scope.emap = emap;
        angular.element($window).bind('resize', function () {
            $scope.$apply(
                $scope.is_narrow = emap.checkSidebarIsNarrow()
            );
        });
        $scope.entryForExport = null;
    }])
    .run(['auth', function (auth) {
        auth.initialize('/auth', false);
    }]);

angular.module('app').config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
}]);

angular.module('app').config(['$animateProvider', function ($animateProvider) {
    $animateProvider.classNameFilter(/animate/);
}]);

angular.module('app').config(['$interpolateProvider', function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
}]);

// angular.module('app').config(['$controllerProvider', function ($controllerProvider) {
//     $controllerProvider.allowGlobals();
// }]);