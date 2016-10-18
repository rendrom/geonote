angular.module('entries.print', [])

.directive("printTable", ["api", function(api) {
    return {
        restrict: 'A',
        replace: true,
//        scope: { entry: '=' },
        templateUrl: 'common/print/print-table.html',
        link: function (scope, element, attrs) {
            scope.fields = ['entryid', 'entry_model', 'entry_software_name','entry_software_vendor','web_address','description',
                'organization', 'inn', 'organization_kpp', 'organization_okved', 'organization_tel','address',
                'postalcode','regioncode','region','city','locality','street','housenum','buildnum', 'strucnum',
                'flatnum','okato','latlng'];
        }
    };
}]);