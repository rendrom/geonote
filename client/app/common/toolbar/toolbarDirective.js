angular.module('toolbar', [])
    .directive('toolBar', [function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'common/toolbar/templates/toolbar.html',
        };
    }]);