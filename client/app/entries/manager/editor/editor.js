angular.module('dynamit.editor', [])

    .directive('dynamitBaseForm', [function () {
        return {
            templateUrl: 'entries/manager/editor/base-form.html',
            restrict: 'A',
            transclude: false,
            replace: true,
            scope: true
        };
    }])
    .directive('dynamitFields', ['appConf', function (appConf) {
        return {
            templateUrl: 'entries/manager/editor/dynamit-fields.html',
            restrict: 'A',
            transclude: false,
            replace: true,
            scope: true,
            controller: (['$scope', function ($scope) {
                $scope.candrag = true;
                $scope.removeDynamitField = function (field) {
                        $scope.dynamit.fields.splice(appConf.getElementIndex(field.id, $scope.dynamit.fields), 1);
                        reorder();
                    };
                $scope.sortableOptions = {
                    stop: function (e, ui) {
                        reorder();

                    }
                };
                function reorder () {
                    for (var index in $scope.dynamit.fields) {
                            $scope.dynamit.fields[index].order = parseInt(index)+1;
                        }
                }
            }])
        };
    }])
    .directive('dynamitField', ['Dynamit', 'appConf', function (Dynamit, appConf) {
        return {
            templateUrl: 'entries/manager/editor/dynamit-field.html',
            restrict: 'A',
            replace: true,
            scope: {field: '=', meta: '=', candrag: '=', action: '&'},
            link: function (scope, element, attrs) {
                if (scope.field !== undefined) {
                    scope.f = scope.field;
                    scope.new = false;
                }
                else {
                    scope.f = {};
                    scope.new = true;
                }
                scope.appendField = function () {
                    scope.action({field: angular.copy(scope.f)});
                    scope.f = {};
                };
                scope.removeField = function (f) {
                    scope.action({field: f});
                };
                scope.slugify = function (field) {
                    field.name = appConf.urlify(field.verbose_name);
                };
                scope.selfslugify = function (field) {
                    field.name = appConf.urlify(field.name);
                };
            }
        };
    }])
    .directive('dynamitOptions', [function () {
        return {
            templateUrl: 'entries/manager/editor/dynamit-options.html',
            restrict: 'A',
            transclude: false,
            replace: true,
            scope: true
        };
    }]);
