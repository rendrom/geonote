angular.module('entries.dynamit.factory', [])
    .factory('Dynamit', ['$q', '$window', '$modal', 'emap', 'api', 'modalService', 'Notification', 'appConf',
        function ($q, $window, $modal, emap, api, modalService, Notification, appConf) {

            function openDynamitModal(dynamit) {
                var tpl = 'entries/manager/editor/editor-modal.html';
                var dynamitEditorModal = $modal;
                var controller = ['$scope', '$modalInstance', 'Dynamit', 'appConf', function ($scope, $modalInstance, Dynamit, appConf) {
                    if (dynamit) {
                        $scope.oldDynamit = dynamit;
                        $scope.dynamit = angular.copy(dynamit);
                    }
                    else {
                        $scope.oldDynamit = null;
                        $scope.dynamit = {fields: []};
                    }
                    $scope.meta = Dynamit.meta;
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                    $scope.create = function () {
                        Dynamit.create($scope.dynamit).then(function () {
                            $modalInstance.dismiss('cancel');
                        }).catch(function (error) {
                            returnError(error);
                        });
                    };
                    $scope.update = function () {
                        Dynamit.update($scope.dynamit).then(function (data) {
                            $modalInstance.dismiss('cancel');
                        });
                    };
                    $scope.appendDynamitField = function (field) {
                        $scope.dynamit.fields.push(field);
                    };
                    $scope.addEmptyField = function () {
                        $scope.dynamit.fields.push({order: $scope.dynamit.fields.length + 1});
                    };
                    $scope.slugify = function (dynamit) {
                        dynamit.slug = appConf.urlify(dynamit.name);
                    };
                    $scope.selfslugify = function (dynamit) {
                        dynamit.slug = appConf.urlify(dynamit.slug);
                    };
                    function returnError(error) {
                        angular.forEach(error.data, function (errors, field) {
                            Notification.error("<strong>" + field + ": </strong>" + errors);
                            if ($scope.dynamitForm['baseForm']) {
                                $scope.dynamitForm['baseForm'][field].$setValidity('server', false);
                            }
                        });
                    }
                }];
                dynamitEditorModal.open({
                    templateUrl: tpl,
                    controller: controller,
                    size: 'lg'
                });
            }

            var defaultOptions = {
                dynamits: [],
                meta: null
            };
            var service = {};
            angular.extend(service, defaultOptions);
            angular.extend(service, {
                query: function () {
                    var deferred = $q.defer();
                    if (service.dynamits.length === 0) {
                        api.dynamit.query().$promise
                            .then(function (data) {
                                service.dynamits = data;
                                deferred.resolve();
                            })
                            .catch(deferred.reject);
                    }
                    else {
                        deferred.resolve();
                    }
                    modalService.progressbar.hide();
                    return deferred.promise;
                },
                reset: function () {
                    service.dynamits = [];
                    return service.query();
                },
                get_meta: function () {
                    var deferred = $q.defer();
                    if (!service.meta) {
                        api.dynamit.get_meta().$promise
                            .then(function (data) {
                                service.meta = data;
                                deferred.resolve(data);
                            })
                            .catch(deferred.reject);
                    }
                    else {
                        deferred.resolve(service.meta);
                    }
                    modalService.progressbar.hide();
                    return deferred.promise;
                },
                create: function (data) {
                    var deferred = $q.defer();
                    api.dynamit.create(data).$promise.then(function (data) {
                        Notification.success('Новый слой добавлен');
                        service.dynamits.unshift(data);
                        deferred.resolve(data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },
                update: function (d) {
                    var deferred = $q.defer();
                    api.dynamit.update({id: d.id}, d).$promise.then(function (data) {
                        var updatedDynamit = appConf.getElementIndex(d.id, service.dynamits);

                        //TODO: получать значения с сервера
                        service.dynamits[updatedDynamit] = d;
                        Notification.success('Cлой ' + d.name + ' обновлён');
                        deferred.resolve(data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },
                //goToCreatePage: function (model) {
                //    $window.location.href = '../../../../dynamit/dynamicmodel/add/';
                //},
                showEditorModal: function (dynamit) {
                    service.get_meta().then(function () {
                            openDynamitModal(dynamit);
                        }
                    );
                }
            });
            return service;
        }]);