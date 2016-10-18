angular.module('modal-work', []).factory('modalService', ['$modal', '$modalStack', 'appConf', function ($modal, $modalStack, appConf) {

    var modalDefaults = {
        backdrop: true,
        keyboard: true,
        modalFade: true,
        templateUrl: 'common/modal/templates/dialog.html'
    };
    var modalOptions = {
        closeButtonText: 'Отменить',
        actionButtonText: 'OK',
        headerText: '',
        bodyText: 'Выполнить эту операцию?'
    };

    function show(customModalDefaults, customModalOptions) {
        //Create temp objects to work with since we're in a singleton service
        var tempModalDefaults = {};
        var tempModalOptions = {};

        //Map angular-ui modal custom defaults to modal defaults defined in service
        angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);
        //Map modal.html $scope custom properties to defaults defined in service
        angular.extend(tempModalOptions, modalOptions, customModalOptions);

        if (!tempModalDefaults.controller) {
            tempModalDefaults.controller = ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                $scope.modalOptions = tempModalOptions;
                $scope.modalOptions.ok = function (result) {
                    $modalInstance.close(result);
                };
                $scope.modalOptions.close = function (result) {
                    appConf.goToManager();
                    $modalInstance.dismiss('cancel');
                };
            }];
        }
        return $modal.open(tempModalDefaults).result;
    }

    var showProgressBar = function (headerText) {

        var progressbarController = ['$scope', '$modalInstance', 'modalService', function ($scope, $modalInstance, modalService) {
            $scope.title = headerText;
            $scope.progressbar = modalService.progressbar;
            $scope.closeModal = function () {
                modalService.progressbar.stop();
                $modalStack.dismissAll();
            };
        }];
        var modalDefaults = {
            controller: progressbarController,
            templateUrl: 'common/modal/templates/progress.html',
            backdrop: 'static'
        };
        $modal.open(modalDefaults);
    };


    var service = {
        progressbar: {
            items: {}, // (items progress: {'name': {'percent' percent, 'upload': Object})
            progress: 100,
            setProgressItem: function (name, item_percent, upload) {
                item_percent = item_percent || 0;
                upload = upload || null;
                service.progressbar.items[name] = {'percent':item_percent, 'upload':upload};
            },
            setProgressItems: function (count) {
                count = count || 1;
                for (var fry = 0; fry < count; fry++) {
                    service.progressbar.setProgressItem(fry);
                }
            },
            updateProgressItem: function (name, item_progress) {
                if (service.progressbar.items.hasOwnProperty(name)) {
                    service.progressbar.items[name]['percent'] = item_progress;
                    service.progressbar.calculateProgress();
                }
            },
            calculateProgress: function () {
                var percents = 0;
                var items_count = 0;
                for (var fry in service.progressbar.items) {
                    if (service.progressbar.items.hasOwnProperty(fry)) {
                        percents += service.progressbar.items[fry]['percent'];
                        items_count += 1;
                    }
                }
                service.progressbar.progress = percents / items_count;
            },
            show: function (headerText) {
                headerText = headerText || 'Загрузка...';
                showProgressBar(headerText);
            },
            showUploader: function (headerText) {
                service.progressbar.progress = 0;
                service.progressbar.show(headerText);
            },
            stop: function () {
                for (var fry in service.progressbar.items) {
                    if (service.progressbar.items.hasOwnProperty(fry)) {
                        if (fry['upload']) {
                            console.log(fry['upload']);
                            fry['upload'].abort();
                        }
                    }
                }
            },
            hide: function () {
                $modalStack.dismissAll();
                service.progressbar.progress = 100;
            }
        },
        showConfirm: function (bodyText) {
            var customModalOptions = {headerText: '', bodyText: bodyText || 'Выполнить операцию?'};
            var customModalDefaults = {backdrop: 'static'};
            return show(customModalDefaults, customModalOptions);
        }
    };

    return service;
}]);