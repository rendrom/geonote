angular.module('appDirectives', [])

.directive('endlessScroll', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var raw = element[0];
                element.bind('scroll', function () {
                    if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                        scope.$apply(attrs.endlessScroll);
                    }
                });
            }
        };
}])

.directive('serverError', function() {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function(scope, element, attrs, ctrl) {
        return element.on('input', function() {
          if (ctrl.$invalid) {
              return scope.$apply(function () {
                  return ctrl.$setValidity('server', true);
              });
          }
        });
      }
    };
  });