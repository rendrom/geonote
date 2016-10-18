angular.module('authster')

    .directive('loginToolbar', ['auth', function (auth) {
        return {
            templateUrl: 'common/auth/login/toolbar.html',
            restrict: 'A',
            replace: true,
            scope: true,
            link: function ($scope, $element, $attrs, $controller) {
                $scope.isAuthenticated = auth.isAuthenticated;
                $scope.login = auth.showLogin;
                $scope.logout = auth.showLogout;
                $scope.register = auth.showRegister;
            }
        };
    }])

    .controller('AuthFormController', ['$scope', '$modalInstance', 'auth','Notification',
        function ($scope, $modalInstance, auth, Notification) {

        $scope.auth_user = {};

        $scope.login = function () {
            $modalInstance.dismiss('cancel');
            auth.login($scope.auth_user.username, $scope.auth_user.password);
        };
        $scope.register = function () {
            var u = $scope.auth_user;
            auth.register(u.username, u.password, u.password2, u.email).catch(function (error) {
                returnError(error);
            });
        };
        $scope.logout = function () {
            $modalInstance.dismiss('cancel');
            auth.logout();
        };
        $scope.clearForm = function () {
            $scope.auth_user = {};
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        function returnError(error) {
            angular.forEach(error, function (errors, field) {
                Notification.error("<strong>" + field + ": </strong>" + errors);
                if ($scope.registerForm) {
                    $scope.registerForm[field].$setValidity('server', false);
                }
            });
        }
    }]);
