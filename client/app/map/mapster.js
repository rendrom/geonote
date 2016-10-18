angular.module('mapster', [])
    .controller('LeafletCtrl', ['$scope', 'emap', function ($scope, emap) {
        var c = this;

        $scope.$on('$destroy', function () {
            c.map.remove();
        });
        function init(id) {
            emap.init(id);
        }

        c.init = init;
    }])

    .directive('leaflet', function leaflet() {
        var _id = 'map';
        return {
            restrict: 'AE',
            replace: true,
            controller: 'LeafletCtrl',
            template: function (element, attributes) {
                var id = attributes.leaflet || _id;
                return '<div id="' + id + '"></div>';
            },
            link: function (scope, element, attributes, controller) {
                var id = attributes.leaflet || _id;
                controller.init(id);
            }
        };
    });