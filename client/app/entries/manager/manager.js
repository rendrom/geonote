angular.module('entries.dynamit', ['entries.dynamit.factory', 'dynamit.editor'])

    .controller('DynamitListCtrl', ['$scope', 'Notification', 'Dynamit', 'Entries', 'emap', 'mapHelpers', 'NAMES', 'SERVER_NAMES',
        function ($scope, Notification, Dynamit, Entries, emap, mapHelpers, NAMES, SERVER_NAMES) {
            Entries.cleanAll();
            $scope.init = function () {
                NAMES.title = SERVER_NAMES.title;
                Dynamit.query().then(function (data) {
                    $scope.Dynamit = Dynamit;
                }).catch();
            };
            $scope.init();
            $scope.goToCreatePage = function () {
                Dynamit.showEditorModal();
            };
        }])
    .directive('dynamitList', ['$upload', '$log','Notification','Dynamit', 'modalService',
        function ($upload, $log, Notification, Dynamit, modalService) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'entries/manager/templates/dynamit-list.html',
            link: function (scope, element) {
                scope.upload = function (files) {
                    modalService.progressbar.show("Идёт загрузка и обработка файла");
                    if (files && files.length) {
                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];
                            $upload.upload({
                                url: 'dynamit_upload/',
                                fields: {},
                                file: file
                            })
                            .progress(uploadProgress)
                            .success(successUpload)
                            .error(errorUpload);
                        }
                    }
                };
                function uploadProgress (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $log.info('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }
                function successUpload (data, status, headers, config) {
                    Dynamit.dynamits.unshift(data['dynamit']);
                    Notification[data['status']['type']](data['status']['result']);
                    modalService.progressbar.hide();
                }
                function errorUpload() {
                    modalService.progressbar.hide();
                }
            }
        };
    }])

    .directive('dynamitInList', ['$window','api','appConf','modalService', 'Dynamit', function ($window, api, appConf, modalService, Dynamit) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'entries/manager/templates/dynamit-in-list.html',
            link: function (scope, element) {
                scope.goToEntry = function (dynamit) {
                    appConf.goToEntry(dynamit.user, dynamit.slug);
                };
                scope.startEdit = function(dynamit) {
                    Dynamit.showEditorModal(dynamit);
                };
                scope.deleteDynamit = function (d) {
                    modalService.showConfirm('Удалить слой '+ d.name+'?').then(function (result) {
                        api.dynamit.delete({id: d.id}).$promise.then(function (data) {
                            Dynamit.dynamits.splice(appConf.getElementIndex(d.id, Dynamit.dynamits), 1);
                        });
                    });
                };
            }
        };
    }]);
