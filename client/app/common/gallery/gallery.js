angular.module('entries.gallery', [])

    .factory('gallery', ['$q', 'api', 'appConf', 'modalService', 'Entries', 'Notification',
        function ($q, api, appConf, modalService, Entries, Notification) {
            var service = {
                images: [],
                query: function (id, dimensions) {
                    var deferred = $q.defer();
                    api.entry.images({
                        id: id,
                        model: Entries.model,
                        username: Entries.username,
                        dimensions: dimensions
                    }).$promise.then(function (data) {
                        service.images = data;
                        deferred.resolve(data);
                    });
                    return deferred.promise;
                },
                deleteImage: function (id) {
                    return api.images.delete({id: id, model: Entries.model, username: Entries.username }).$promise;
                }
            };
            return service;
        }])

    .directive("galleryList", ['$upload', '$log','gallery', 'Entries','auth', 'modalService','appConf',
        function ($upload, $log, gallery, Entries, auth, modalService, appConf) {
        return {
            restrict: 'A',
            replace: true,
            scope: {entry: '=', enable: '=', canedit: '=', dimensions: '@'},
            templateUrl: 'common/gallery/templates/gallery.html',
            link: function (scope, element, attrs) {
                var dimensions = scope.dimensions || '200x200';
                var canedit = scope.canedit || false;
                scope.images = [];
                if (scope.entry && scope.enable) {
                    gallery.query(scope.entry.id, dimensions).then(function (images) {
                            scope.images = images;
                        }
                    );
                }
                scope.upload = function (files) {
                    var title = files.length > 1 ? "Загрузка фотографий": "Загрузка фотографии";
                    modalService.progressbar.showUploader(title);
                    if (files && files.length) {
                        for (var fry = 0; fry < files.length; fry++) {
                            var file = files[fry];
                            var upload = $upload.upload({
                                url: 'api/images/' + Entries.username + '/' + Entries.model + '/' + scope.entry.id +'/',
                                fields: {'dimensions': dimensions},
                                file: file
                            })
                                .progress(uploadProgress)
                                .success(successUpload)
                                .error(errorUpload);
                            modalService.progressbar.setProgressItem(file.name, 0, upload);
                        }
                    }
                };
                scope.deleteImage = function (id) {
                    modalService.showConfirm('Подтвердите удаление фотографии').then(function (result) {
                        gallery.deleteImage(id).then(function () {
                            scope.images.splice(appConf.getElementIndex(id, scope.images), 1);
                        });
                    });
                };
                function uploadProgress(evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    modalService.progressbar.updateProgressItem(evt.config.file.name, progressPercentage);
                }
                function successUpload(data, status, headers, config) {
                    scope.images.unshift(data);
                    modalService.progressbar.hide();
                }
                function errorUpload() {
                    modalService.progressbar.hide();
                }
            }

        };
    }])

    .directive("galleryItem", ["api", "auth", "gallery", function (api, auth, gallery) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'common/gallery/templates/image.html',
            link: function (scope, element, attrs) {
                //scope.c = angular.copy(scope.comment);
                //scope.changeCommentLength = function (c) {
                //    if (c.textLength === comments.commentLenght) {
                //        c.textLength = 9999;
                //        c.readMoreText = 'Скрыть';
                //    }
                //    else {
                //        c.textLength = comments.commentLenght;
                //        c.readMoreText = 'Читать дальше';
                //    }
                //};
                //scope.updateComment = function (c) {
                //    scope.comment = comments.updateComment(c);
                //    scope.cancelCommentEditing(c);
                //};
                //scope.editComment = function (c) {
                //    comments.cancelAllCommentEditing();
                //    c.editModeOn = true;
                //};
                //scope.deleteComment = function (id) {
                //    comments.deleteComment(id);
                //};
                //scope.cancelCommentEditing = function (c) {
                //    c.editModeOn = false;
                //    scope.c = angular.copy(scope.comment);
                //};
            }
        };
    }]);
