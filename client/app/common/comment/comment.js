angular.module('entries.comment', [])

    .factory('entries.comment', ['$q', 'api', 'appConf', 'modalService', 'Entries', 'Notification',
        function ($q, api, appConf, modalService, Entries, Notification){
        var service = {
            comments: null,
            commentLenght: maxCommentLenght || 120,
            beginCommentsLimit: beginCommentsLimit || 1,
            commentsLimit: beginCommentsLimit || 1,
            getEntryComments: function (id) {
                service.comments = null;
                api.entry.comments({id: id, model: Entries.model, username: Entries.username}, function (data) {
                    service.comments = data;
                    angular.forEach(service.comments, function (item) {
                        item.textLength = service.commentLenght;
                        item.readMoreText = 'Читать дальше';
                    });
                });
            },
            createComment: function (comment, id) {
                var deferred = $q.defer();
                service.cancelAllCommentEditing();
                var data = {comment: comment, object_pk: id};
                api.comment.create({model: Entries.model, username: Entries.username}, data).$promise.then(function (data) {
                    data.textLength = service.commentLenght;
                    data.readMoreText = 'Читать дальше';
                    data.entry = id;
                    Notification.success("Комментарий опубликован!");
                    comment = '';
                    service.comments.unshift(data);
                    deferred.resolve();
                }).catch(deferred.reject());
                return deferred.promise;
            },
            updateComment: function (c) {
                api.comment.update({id: c.id, model: Entries.model, username: Entries.username }, c, function (data) {
                        data.textLength = service.commentLenght;
                        c = data;
                        Notification.success("Комментарий изменён");
                        var curComment = appConf.getElementIndex(data.id, service.comments);
                        service.comments[curComment] = data;
                    }
                );
                return c;
            },
            deleteComment: function (id) {
                modalService.showConfirm('Вы уверены, что хотите удалить этот комментарий?').then(function (result) {
                    api.comment.delete({id: id, model: Entries.model, username: Entries.username}, function () {
                        Notification.success("Комментарий удалён");
                        service.comments.splice(appConf.getElementIndex(id, service.comments), 1);
                    });
                });
            },
            cancelAllCommentEditing: function () {
                for (var fry = 0; fry < service.comments.length; fry++) {
                    if (service.comments[fry].editModeOn) {
                        service.comments[fry].editModeOn = false;
                    }
                }
            }
        };
        return service;
    }])

    .directive("commentList", ["entries.comment", "auth", function (comments, auth) {
        return {
            restrict: 'A',
            replace: true,
            scope: {entry: '=', enable: '='},
            templateUrl: 'common/comment/templates/comments.html',
            link: function (scope, element, attrs) {
                scope.comments = {};
                scope.auth = auth;
                if (scope.entry && scope.enable) {
                    comments.getEntryComments(scope.entry.id);
                    scope.comments = comments;
                }
                scope.showAllComments = function () {
                    comments.commentsLimit = comments.commentsLimit === beginCommentsLimit ? 9999 : beginCommentsLimit;
                };
            }

        };
    }])

    .directive("commentItem", ["api", "auth", "entries.comment", function (api, auth, comments) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'common/comment/templates/comment.html',
            link: function (scope, element, attrs) {
                scope.c = angular.copy(scope.comment);
                scope.changeCommentLength = function (c) {
                    if (c.textLength === comments.commentLenght) {
                        c.textLength = 9999;
                        c.readMoreText = 'Скрыть';
                    }
                    else {
                        c.textLength = comments.commentLenght;
                        c.readMoreText = 'Читать дальше';
                    }
                };
                scope.updateComment = function (c) {
                    scope.comment = comments.updateComment(c);
                    scope.cancelCommentEditing(c);
                };
                scope.editComment = function (c) {
                    comments.cancelAllCommentEditing();
                    c.editModeOn = true;
                };
                scope.deleteComment = function (id) {
                    comments.deleteComment(id);
                };
                scope.cancelCommentEditing = function (c) {
                    c.editModeOn = false;
                    scope.c = angular.copy(scope.comment);
                };
            }
        };
    }]);
