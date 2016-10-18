/*! geonote - v 0.1.5 - 2016-10-19 */ 
angular.module('app', [
    'ngCookies',
    'ngTouch',
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'templates.app',
    'ui-notification',
    'ui.sortable',
    'angularFileUpload',
    'angular-carousel',

    'app-common',
    'entries'
]);

angular.module('app').controller('AppController',
    ['$window', '$scope', '$location', 'auth', 'Entries', 'NAMES', 'appConf', 'emap', 'modalService',
    function ($window, $scope, $location, auth, Entries, NAMES, appConf, emap, modalService) {
        $scope.auth = auth;
        $scope.Entries = Entries;

        $scope.NAMES = NAMES;

        $scope.showOnTheMap = function (id) {
            emap.sidebarClick(id);
        };
        $scope.bboxSearchMode = function () {
            if (emap.bboxSearchMode.enabled()) {
                emap.bboxSearchMode.disable();
            }
            else {
                emap.bboxSearchMode.enable();
            }
        };
        $scope.goToMainPage = function () {
            appConf.goToMainPage();
        };
        $scope.backToList = function () {
            appConf.backToList(Entries.username, Entries.model);
        };
        $scope.cleanSelection = function () {
            appConf.cleanSelection(Entries.username, Entries.model);
        };
        $scope.goToDetail = function (id) {
            appConf.goToDetail(Entries.username, Entries.model, id);
        };
        $scope.goToCreatePage = function () {
            $location.path(Entries.username + '/layer/' + Entries.model + '/create');
        };
        $scope.showSidebar = function () {
            emap.showSidebar();
        };
        $scope.hideSidebar = function () {
            emap.hideSidebar();
        };
        $scope.toggleSidebar = function () {
            emap.toggleSidebar();
        };
        $scope.showFullExtent = function () {
            emap.showFullExtent();
        };
        $scope.is_filter = false;
        //TODO: перенести в сервис. Избавиться от $watchCollection
        $scope.$watchCollection('Entries.queryParam', function (newVal, oldVal) {
            var has_filter = false;
            for (var fry in Entries.queryParam) {
                if (Entries.queryParam.hasOwnProperty(fry)) {
                    if (Entries.queryParam[fry]) {
                        $scope.is_filter = has_filter = true;
                        break;
                    }
                }
            }
            $scope.is_filter = has_filter;
        });
        /**
         is_narrow - показывает статус боковой панели. Может быть широкой(false) или узкой(true)
         нелинейно зависит ош ширины окна браузера
         */
        $scope.emap = emap;
        angular.element($window).bind('resize', function () {
            $scope.$apply(
                $scope.is_narrow = emap.checkSidebarIsNarrow()
            );
        });
        $scope.entryForExport = null;
    }])
    .run(['auth', function (auth) {
        auth.initialize('/auth', false);
    }]);

angular.module('app').config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
}]);

angular.module('app').config(['$animateProvider', function ($animateProvider) {
    $animateProvider.classNameFilter(/animate/);
}]);

angular.module('app').config(['$interpolateProvider', function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
}]);

// angular.module('app').config(['$controllerProvider', function ($controllerProvider) {
//     $controllerProvider.allowGlobals();
// }]);
angular.module('authster', [])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/activate/:uid/:token', {
                templateUrl: 'entries/manager/templates/sidebar.html',
                controller: 'DynamitListCtrl',
                resolve: {
                    authenticated: ['auth', function (djangoAuth) {
                        return djangoAuth.authenticationStatus();
                    }]
                }
            });

    }])

    .factory('auth', ['$q', '$http', '$cookies', '$log', '$location', '$modal', 'api', 'Notification', 'Dynamit',
        function ($q, $http, $cookies, $log, $location, $modal, api, Notification, Dynamit) {
            function redirect(url) {
                url = url || '/';
                Dynamit.reset().then(function () {
                    $location.path(url);
                });
            }

            var loginModal = null;

            function openLoginModal(path) {
                path = path || 'login-form.html';
                var baseHTMLPath = 'common/auth/login/',
                    tpl = baseHTMLPath + path;
                loginModal = $modal;
                loginModal.open({templateUrl: tpl, controller: 'AuthFormController'});
            }

            var service = {
                API_URL: '/auth',
                use_session: false,
                /* END OF CUSTOMIZATION */
                authenticated: null,
                authPromise: null,
                user: null,
                is_superuser: false,
                request: function (args) {
                    var djangoAuth = this;
                    // Let's retrieve the token from the cookie, if available
                    if ($cookies.token) {
                        $http.defaults.headers.common.Authorization = 'Token ' + $cookies.token;
                    }
                    // Continue
                    var params = args.params || {};
                    args = args || {};
                    var deferred = $q.defer(),
                        url = this.API_URL + args.url,
                        method = args.method || "GET",
                        data = args.data || {};
                    // Fire the request, as configured.
                    $http({
                        url: url,
                        withCredentials: this.use_session,
                        method: method.toUpperCase(),
                        headers: {'X-CSRFToken': $cookies['csrftoken']},
                        params: params,
                        data: data
                    })
                        .success(angular.bind(this, function (data, status, headers, config) {
                            deferred.resolve(data, status);
                        }))
                        .error(angular.bind(this, function (data, status, headers, config) {
                            $log.info("error syncing with: " + url);
                            djangoAuth.removeToken();
                            // Set request status
                            if (data) {
                                data.status = status;
                            }
                            if (status === 0) {
                                if (data === "") {
                                    data = {};
                                    data['status'] = 0;
                                    data['non_field_errors'] = ["Could not connect. Please try again."];
                                }
                                // or if the data is null, then there was a timeout.
                                if (data == null) {
                                    // Inject a non field error alerting the user
                                    // that there's been a timeout error.
                                    data = {};
                                    data['status'] = 0;
                                    data['non_field_errors'] = ["Server timed out. Please try again."];
                                }
                            }
                            deferred.reject(data, status, headers, config);
                        }));
                    return deferred.promise;
                },
                login: function (username, password) {
                    var djangoAuth = this;
                    return this.request({
                        'method': "POST",
                        'url': "/login/",
                        'data': {
                            'username': username,
                            'password': password
                        }
                    }).then(function (data) {
                        djangoAuth.setToken(data.auth_token);
                        djangoAuth.authPromise = null;
                        djangoAuth.authenticationStatus(false, false).then(function (data) {
                            Notification.success("Добро пожаловать на сайт, <b>" + data.username + "</b>!");
                            redirect();
                        });
                    }).catch(function(){
                        djangoAuth.removeToken();
                    });
                },
                removeToken: function() {
                    delete $http.defaults.headers.common.Authorization;
                    delete $cookies.token;
                },
                setToken: function (token) {
                    if (token) {
                        if (!this.use_session) {
                            $http.defaults.headers.common.Authorization = 'Token ' + token;
                            $cookies.token = token;
                        }
                    }
                },
                logout: function (redirectTo) {
                    var djangoAuth = this;
                    return this.request({'method': "POST", 'url': "/logout/"}).then(function (data) {
                        Notification.success("До свидания, <b>" + djangoAuth.user + "</b>!");
                        djangoAuth.removeToken();
                        djangoAuth.user = null;
                        djangoAuth.is_superuser = false;
                        redirect(redirectTo);
                    });
                },
                register: function (username, password, password2, email, more) {
                    var djangoAuth = this;
                    var data = {
                        'username': username,
                        'password': password,
                        'password2': password2,
                        'email': email
                    };
                    data = angular.extend(data, more);
                    return this.request({
                        'method': "POST",
                        'url': "/register/",
                        'data': data
                    }).then(function(data) {
                        if (data.auth_token) {
                            djangoAuth.setToken(data.auth_token);
                            djangoAuth.authPromise = null;
                            djangoAuth.authenticationStatus(false, false).then(function (user) {
                                Notification.success("Добро пожаловать на сайт, <b>" + user.username + "</b>!");
                                redirect();
                            });
                        }
                    });
                },
                authenticationStatus: function (restrict, force) {
                    // Set restrict to true to reject the promise if not logged in
                    // Set to false or omit to resolve when status is known
                    // Set force to true to ignore stored value and query API
                    restrict = restrict || false;
                    force = force || false;
                    if (this.authPromise === null || force) {
                        this.authPromise = this.request({
                            'method': "GET",
                            'url': "/me/"
                        });
                    }
                    var da = this;
                    var getAuthStatus = $q.defer();
                    if (this.user !== null && !force) {
                        // We have a stored value which means we can pass it back right away.
                        if (this.user === false && restrict) {
                            getAuthStatus.reject("User is not logged in.");
                        } else {
                            getAuthStatus.resolve();
                        }
                    } else {
                        // There isn't a stored value, or we're forcing a request back to
                        // the API to get the authentication status.
                        this.authPromise.then(function (data) {
                            da.user = data.username;
                            da.is_superuser = data.is_superuser;
                            getAuthStatus.resolve(data);
                        });
                    }
                    return getAuthStatus.promise;
                },
                initialize: function (url, sessions) {
                    if ($cookies.token) {
                        this.API_URL = url;
                        this.use_session = sessions;
                        return this.authenticationStatus();
                    }
                },
                showLogin: function () {
                    openLoginModal();
                },
                showLogout: function () {
                    openLoginModal('logout-form.html');
                },
                showRegister: function () {
                    openLoginModal('register-form.html');
                },
                isAuthenticated: function () {
                    return !!this.user;
                },
                isAdmin: function () {
                    return !!(service.user && service.is_superuser);
                }
            };
            return service;
        }]);

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

angular.module('app-common', [
    'appDirectives',
    'appServices',
    'appFilters',
    'modal-work',
    'authster',
    'mapster',
    'toolbar'
]);
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
angular.module('appFilters', [])

.filter('truncate', function () {
    return function (text, length, end) {
        if (text!==undefined) {
            if (isNaN(length)) {
                length = 10;
            }

            if (end === undefined) {
                end = "...";
            }
            text = text.toString();
            if (text.length <= length || text.length - end.length <= length) {

                return text;
            }
            else {
                return String(text).substring(0, length - end.length) + end;
            }
        }
    };
});


angular.module('appServices', ['ngResource'])
    .service('appConf', ["$window", "$location", function ($window, $location) {
        return {
            goToManager: function () {
                $window.location.href = '#/';
            },
            backToList: function (username, model) {
                var url = '/';
                if (username) {
                    url += username + '/layer/';
                }
                if (model) {
                    url += model;
                }
                $location.path(url);
            },
            cleanSelection: function (user, model) {
                this.goToEntry(user, model);
            },
            goToMainPage: function() {
                $window.location.href = '#/';
            },
            goToDetail: function (username, model, id) {
                $location.path('/' + username +'/layer/' + model + '/' + id);
            },
            getElementIndex: function (id, elements, field) {
                field = field || 'id';
                for (var fry = 0; fry < elements.length; fry++) {
                    if (elements[fry][field] === id) {
                        return fry;
                    }
                }
                return -1;
            },
            goToEntry: function (username, model) {
                $window.location.href = '#/'+ username +'/layer/'+model;
            },
            getUrlParameters: function (parameter, staticURL, decode) {
                var currLocation = (staticURL.length) ? staticURL : $window.location.href;
                var parArr = currLocation.split("?").length > 1 ? currLocation.split("?")[1].split("&") : [];
                for (var i = 0; i < parArr.length; i++) {
                    var parr = parArr[i].split("=");
                    if (parr[0] === parameter) {
                        return (decode) ? decodeURIComponent(parr[1]) : parr[1];
                    }
                }
                return '';
            },
            getEntryById: function(id, array) {
                var entryPos = array.map(function(x) {return x.id; }).indexOf(id);
                if (entryPos !== -1) {
                    return array[entryPos];
                }
                return false;
            },
            urlify: function(value) {
                if (URLify!==undefined){
                    return value ? $window.URLify(value) : '';
                }
                else {
                    throw 'URLify.js required';
                }
            }
        };
    }])

    .factory('api', ["$resource", function ($resource) {
        function add_auth_header(data, headersGetter) {
            var headers = headersGetter();
            headers['Authorization'] = ('Basic ' + btoa(data.username +
            ':' + data.password));
        }

        return {
            auth: $resource('/auth/', {}, {
                login: {method: 'POST', url: '/auth/login'},
                logout: {method: 'POST', url: '/auth/logout'},
                me: {method: 'GET', url: '/auth/me'}
            }),
            comment: $resource('/api/comments/:username/:model/', {}, {
                create: {method: 'POST'},
                delete: {method: 'DELETE', url: '/api/comments/:username/:model/:id/'},
                update: {method: 'PUT', url: '/api/comments/:username/:model/:id/'}
            }),
            images: $resource('/api/images/:username/:model/', {}, {
                create: {method: 'POST'},
                delete: {method: 'DELETE', url: '/api/images/:username/:model/:id/'},
                update: {method: 'PUT', url: '/api/images/:username/:model/:id/'}
            }),
            dynamit: $resource('/api/dynamit/', {}, {
                create: {method: 'POST'},
                query: {method: 'GET', isArray: true},
                get_meta: {method: 'OPTIONS'},
                update: {method: 'PUT', url: '/api/dynamit/:id/'},
                delete: {method: 'DELETE', url: '/api/dynamit/:id/'}
            }),
            entry: $resource('/api/entry/:username/:model/', {}, {
                query: {method: 'GET', isArray: false},
                get_meta: {method: 'OPTIONS'},
                get: {method: 'GET', url: '/api/entry_large/:username/:model/:id/'},
                comments: {method: 'GET', url: '/api/entry/:username/:model/:id/comments/', isArray: true},
                images: {method: 'GET', url: '/api/entry/:username/:model/:id/images/', isArray: true}
            }),
            entry_large: $resource('/api/entry_large/:username/:model/', {}, {
                query: {method: 'GET', isArray: true},
                create: {method: 'POST'},
                delete: {method: 'DELETE', url: '/api/entry_large/:username/:model/:id/'},
                get: {method: 'GET', url: '/api/entry_large/:username/:model/:id/'},
                get_meta: {method: 'OPTIONS', url: '/api/entry_large/:username/:model/:id/'},
                update: {method: 'PUT', url: '/api/entry_large/:username/:model/:id/'}
            })
        };
    }]);

angular.module('ngResource').config([
    '$resourceProvider', function($resourceProvider) {
        $resourceProvider.defaults.stripTrailingSlashes = false;
    }
]);
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
angular.module('toolbar', [])
    .directive('toolBar', [function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'common/toolbar/templates/toolbar.html',
        };
    }]);
angular.module('entries.detail', ['entries.print', 'entries.comment', 'entries.gallery'])

    .controller('EntryDetailCtrl', ["$scope", "$routeParams", "$controller", "Entries", "api", "appConf", "emap", "mapDefaults", "mapHelpers", "entries.comment",
        function ($scope, $routeParams, $controller, Entries, api, appConf, emap, mapDefaults, mapHelpers, comments) {
            $scope.editmode = false;
            $scope.geom = null;

            $scope.entryDetail = function () {
                Entries.setModel($routeParams.username, $routeParams.model, $routeParams.id).then(function (meta) {
                    $scope.entryMeta = meta;
                    if ($routeParams.id) {
                        $scope.entry = {'id': $routeParams.id};
                        Entries.get($routeParams.username, $routeParams.model, $routeParams.id).then(function (data) {
                            $scope.entry = data;
                            $scope.entryMeta = Entries.meta;
                            $scope.entry_bkp = angular.copy($scope.entry);
                            if (Entries.editmode) {
                                $scope.startEdit();
                                Entries.editmode = false;
                            }
                            $scope.entry_bkp = angular.copy($scope.entry);
                        });
                    }
                    else {
                        $scope.entry = {};
                        $scope.editmode = true;
                        $scope.createmode = true;
                    }
                });
            };
            $scope.entryDetail();
            $scope.brothers = null;
            $scope.num_in_cluster = null;
            $scope.$watchCollection('brothers', function (newVal, oldVal) {
                if (newVal && newVal.length > 1) {
                    for (var fry = 0; fry < newVal.length; fry++) {
                        if (newVal[fry] === $routeParams.id) {
                            $scope.previous = (fry !== 0) ? newVal[fry - 1] : newVal[newVal.length - 1];
                            $scope.next = (fry < newVal.length - 1) ? newVal[fry + 1] : newVal[0];
                            $scope.num_in_cluster = fry + 1;
                        }
                    }
                }
            });
            $scope.deleteEntry = function (id) {
                Entries.deleteEntry(id).then(function () {
                    emap.drawnItems.clearLayers();
                    appConf.backToList(Entries.model);
                });
            };
            //TODO: перенести в сервис Print
            $scope.uploadEntry = function (id) {
                //mapHelpers.applyScope('map', {'entryForExport': $scope.entry});
                //angular.element('#printModal').modal('show');
                //var preload = document.createElement("button");
                //preload.className = 'btn btn-default pull-right';
                //preload.innerHTML = "Идёт подготовка изображения";
                //preload.disabled = true;
                //document.getElementById('saveimg').innerHTML = '';
                //document.getElementById('saveimg').appendChild(preload);
                //document.getElementById('printmap-container').innerHTML = "<div id='printmap'></div>";
                //setTimeout(function() {
                //   createPrintMap(id);
                //}, 1000);
            };
            $scope.createComment = function (c, id) {
                comments.createComment(c, id).then(
                    $scope.comment = ''
                );
            };
        }])

    .directive('entryAttr', ['$http', 'api', 'Entries', 'emap', 'mapDefaults', 'mapHelpers', 'appConf', 'Notification',
        function ($http, api, Entries, emap, mapDefaults, mapHelpers, appConf, Notification) {
            return {
                restrict: 'A',
                replace: true,
                transclude: false,
                templateUrl: 'entries/detail/templates/form/form.html',
                controller: ['$scope', function ($scope) {
                    $scope.createOrUpdate = function () {
                        if ($scope.createmode) {
                            $scope.createEntry();
                        }
                        else if ($scope.editmode) {
                            $scope.updateEntry();
                        }
                    };
                    $scope.createEntry = function () {
                        $scope.errors = {};
                        var data = $scope.entry;
                        $scope.entry.geom = $scope.geom;
                        Entries.create(data).then(function (data) {
                            drawEntryFromResponseData(data);
                            appConf.goToDetail(Entries.username, Entries.model, data.id);
                            Notification.success("Объект добавлен");
                        }).catch(function (error) {
                            returnError(error);
                        });
                    };
                    $scope.updateEntry = function () {
                        $scope.errors = {};
                        cancelEntryMarkerEdit();
                        var data = $scope.entry;
                        $scope.entry.geom = $scope.geom;
                        Entries.update($scope.entry.id, data).then(function (data) {
                            updateEntryFromRespData(data);
                            drawEntryFromResponseData(data);
                            Notification.success("Объект " + data.entryid + " обновлён");
                            $scope.editmode = false;
                            $scope.entry_bkp = angular.copy($scope.entry);
                            Entries.entryToUpdate = $scope.entry;
                        }).catch(function (error) {
                            returnError(error);
                        });
                    };
                    function returnError(error) {
                        Notification.error("<strong>Ошибка при заполнении формы</strong>");
                        var firstErrorField = null;
                        var timeout = 0;
                        angular.forEach(error.data, function (errors, field) {
                            if (!firstErrorField) {
                                firstErrorField = field;
                            }
                            if ($scope.entryForm['entryFieldForm-' + field]) {
                                $scope.entryForm['entryFieldForm-' + field].entryFieldForm[field].$setValidity('server', false);
                                for (var fry = 0; fry < $scope.panels.length; fry++) {
                                    for (var f = 0; f < $scope.panels[fry].fields.length; f++) {
                                        if ($scope.panels[fry].fields[f] === field) {
                                            if ($scope.panels[fry].collapsed) {
                                                $scope.collapseToggle($scope.panels[fry]);
                                                timeout = 1000;
                                            }
                                        }
                                    }
                                }
                            }
//                    $scope.errors[field] = errors.join(', ');
                        });
                        if (firstErrorField) {
                            var $invalidInput;
                            var $sidebarBody = angular.element('.sidebar-body');
                            angular.forEach($sidebarBody.find('input'), function (node) {
                                if (node.name === firstErrorField) {
                                    $invalidInput = angular.element("input[name=" + node.name + "]");
                                }
                            });
                            if ($invalidInput) {
                                setTimeout(function () {
                                    $sidebarBody.scrollTop($sidebarBody.scrollTop() + $invalidInput.position().top - 5);
                                }, timeout);
                            }
                        }
                    }

                    function updateEntryFromRespData(data) {
                        for (var d in data) {
                            if (data.hasOwnProperty(d)) {
                                if ($scope.entry.hasOwnProperty(d)) {
                                    if ($scope.entry[d] !== data[d]) {
                                        $scope.entry[d] = data[d];
                                    }
                                }
                            }
                        }
                    }

                    function drawEntryFromResponseData(data) {
                        if (emap.drawnItems.getLayers()[0] !== undefined) {
                            emap.drawnItems.clearLayers();
                            emap.entryLayer.addData(mapHelpers.createGeoJsonEntry(data.id, data.geom));
                            var layer = mapHelpers.findInMapLayer(data.id, emap.entryLayer);
                            Entries.entryIcoToReturn = layer;
                            layer.setIcon(mapDefaults.singleCurrentIcon);
                            emap.redrawEntryLayer();
                        }
                    }

                    $scope.drawNewMarkerMode = emap.drawMode.enabled();
                    $scope.drawNewEntryMarker = function () {
                        if (!emap.drawMode.enabled()) {
                            emap.drawnItems.clearLayers();
                            emap.drawMode.enable();
                        }
                        else {
                            emap.drawMode.disable();
                        }
                        $scope.drawNewMarkerMode = emap.drawMode.enabled();
                        angular.element('.btn').blur();
                    };
                    $scope.toggleEdit = function (id) {
                        if (!$scope.editmode) {
                            $scope.startEdit(id);
                        }
                        else {
                            $scope.cancelEditing();
                        }
                    };
                    $scope.startEdit = function (id) {
                        $scope.editmode = true;
                        var existGeom = mapHelpers.findInMapLayerAndRemove($scope.entry.id, emap.entryLayer);
                        if (existGeom) {
                            emap.removeMarkerFromLayer($scope.entry.id);
                            $scope.geom = $scope.entry.geom;
                            existGeom.setIcon(mapDefaults.singleCurrentIcon).setZIndexOffset(20);
                            emap.drawnItems.addLayer(existGeom);
                            Entries.entriesLayerToReturn = emap.drawnItems.getLayers()[0].toGeoJSON();
                        }
                    };
                    $scope.cancelEditing = function () {
                        if ($scope.createmode) {
                            appConf.goToEntry(Entries.model);
                        }
                        else {
                            $scope.entry = angular.copy($scope.entry_bkp);
                            $scope.editmode = false;
                            if (Entries.entriesLayerToReturn) {
                                var layer = Entries.entriesLayerToReturn;
                                emap.returnLayerBack(layer);
                                Entries.entriesLayerToReturn = null;
                                layer = mapHelpers.findInMapLayer($scope.entry.id, emap.markerClusters);
                                Entries.entryIcoToReturn = layer;
                                layer.setIcon(mapDefaults.singleCurrentIcon);
                                emap.clickToLayer(layer);
                                cancelEntryMarkerEdit();
                            }
                        }
                    };
                    $scope.geomEditMode = emap.geomEditMode.enabled();
                    $scope.triggerEntryMarkerEdit = function () {
                        if (emap.geomEditMode.enabled()) {
                            cancelEntryMarkerEdit();
                        }
                        else {
                            emap.geomEditMode.enable();
                            $scope.geomEditMode = true;
                        }
                        angular.element('.btn').blur();
                    };
                    function cancelEntryMarkerEdit() {
                        emap.geomEditMode.save();
                        emap.geomEditMode.disable();
                        $scope.geomEditMode = false;
                    }

                    $scope.getGeometryFromCoordInput = function (e) {
                        if (e.coordinates) {
                            emap.drawnItems.clearLayers();
                            emap.drawMode.disable();
                            var coord, x, y,
                                reDd = /^(-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6})[, ]*(-?([1]?[0-7][0-9]|[1]?[0-8][0]|[1-9]?[0-9])\.{1}\d{1,6})$/,
                                reGgMmSs = /^(-?(90[ :°d]*00[ :\'\'m]*00(\.0+)?|[0-8][0-9][ :°d]*[0-5][0-9][ :\'\'m]*[0-5][0-9](\.\d+)?)[ :\?\"s]*(N|n|S|s|[с,ю]\.?ш\.?)?)[ ,]*(-?(180[ :°d]*00[ :\'\'m]*00(\.0+)?|([1]?[0-7][1-9]|[1]?[1-8][0]|[1-9]?[0-9])[ :°d]*[0-5][0-9][ :\'\'m]*[0-5][0-9](\.\d+)?)[ :\?\"s]*(E|e|W|w|[з,в]\.?д\.?)?)$/;
                            if (reDd.exec(e.coordinates)) {
                                coord = reDd.exec(e.coordinates);
                                x = coord[1];
                                y = coord[3];
                            }
                            else if (reGgMmSs.exec(e.coordinates)) {
                                coord = reGgMmSs.exec(e.coordinates);
                                var lat = coord[2].split(" ");
                                var lng = coord[7].split(" ");
                                x = lat[0] * 1 + (lat[1] / 60) + (lat[2] / 3600);
                                y = lng[0] * 1 + (lng[1] / 60) + (lng[2] / 3600);

                            }
                            if (x && y) {
                                var xyMarker = L.marker([x, y]).setIcon(mapDefaults.singleCurrentIcon);
                                emap.drawnItems.addLayer(xyMarker);
                                map.panTo(xyMarker.getLatLng());
                                $scope.geom = e.geom = mapHelpers.toWKT(xyMarker);
                            }
                        }
                    };
                }],
                link: function (scope, element, attrs) {
                    Entries.getPanels().then(function (panels) {
                        scope.panels = panels;
                    });
                    scope.entryAddr = {};
                    scope.is_collapsed = function (panel) {
                        return Entries.panel_collapsed[panel.id] !== undefined ? Entries.panel_collapsed[panel.id] : panel.collapsed;
                    };
                    scope.collapseToggle = function (panel) {
                        Entries.panel_collapsed[panel.id] = panel.collapsed = !panel.collapsed;
                        angular.element('#collapse' + panel.id).collapse('toggle');
                    };
                    scope.addressAutocomplate = function (val, field, panel) {
                        scope.entry[field] = val;
                        var code = '';
                        if (scope.entry.code && panel.widget) {
                            var addrIndex = panel.widget.indexOf(field);
                            if (addrIndex >= 0) {
                                for (var fry = 0; fry < addrIndex; fry++) {
                                    if (scope.entryAddr[panel.widget[fry]]) {
                                        code = scope.entry.code;
                                        break;
                                    }
                                }
                            }
                        }
                        return $http.get('/entry/addr_autocomplete/', {
                            params: {
                                q: val,
                                field: field,
                                code: code,
                                regioncode: scope.entryAddr.regioncode
                            }
                        }).then(function (response) {
                            if (response.data) {
                                return response.data.map(function (item) {
                                    return item;
                                });
                            }
                            return {};
                        });
                    };
                    scope.formatAddr = function ($model, field) {
                        if ($model !== undefined && $model['full_name']) {
                            if (field === 'regioncode') {
                                return $model[field];
                            }
                            else {
                                return $model['full_name'];
                            }
                        } else {
                            return $model;
                        }
                    };
                    scope.onAddressSelect = function ($item, $model, $label, field, panel) {
                        if (panel.widget) {
                            //  TODO: заменить "-2" которое исключает поля geom и latlng
                            for (var fry = 0; fry < panel.fields.length - 2; fry++) {
                                if (panel.fields[fry] !== field) {
                                    scope['entryAddr'][panel.fields[fry]] = scope.entry[panel.fields[fry]] = '';
                                }
                            }
                        }
                        if (field === 'regioncode') {
                            scope.entry[field] = $item.regioncode;
                        }
                        if (field === 'code') {
                            scope.entryAddr[$item.field] = $item;
                            scope.entry[$item.field] = $item['full_name'];
                        }
                        scope.entry.okato = $item.okato;
                        scope.entry.postalcode = $item.postalcode;
                        scope.entryAddr.code = scope.entry.code = $item.code;
                        scope.entryAddr.regioncode = scope.entry.regioncode = $item.regioncode;
                        scope.getAddrParentsAutocomplete($item.parents);
                    };
                    scope.getAddrParentsAutocomplete = function (data) {
                        if (data && data.length) {
                            for (var fry = 0; fry < data.length; fry++) {
                                if (data[fry].hasOwnProperty('field')) {
                                    scope.entryAddr[data[fry]['field']] = data[fry]['full_name'];
                                    scope.entry[data[fry]['field']] = data[fry]['full_name'];
                                }
                            }
                        }
                    };
                    scope.getTypeheadTemplate = function (field) {
                        var path = 'entries/detail/templates/form-widget';
                        var template = 'addr-input-autocomplete.html';
                        switch (field) {
                            case 'regioncode':
                                template = 'addr-input-auto-regioncode.html';
                                break;
                            case 'code':
                                template = 'addr-input-auto-code.html';
                                break;
                        }
                        return path + template;
                    };
                    scope.getTypeheadMinLength = function (field) {
                        if (field === 'regioncode') {
                            return 1;
                        }
                        return 2;
                    };
                }
            };
        }])

    .directive("inputControl", ['$compile', '$http', '$templateCache', function ($compile, $http) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element) {
                scope.getInputUrl = function () {
                    var html_template;
                    if (scope.panel['custom_edit_template'] && scope.panel.custom_edit_template[scope.field]) {
                        html_template = scope.panel.custom_edit_template[scope.field];
                    }
                    else if (scope.panel.widget && scope.panel.widget.indexOf(scope.field) > -1) {
                        html_template = 'typeahead-input.html';
                    }
                    else {
                        var field_type;
                        html_template = 'input.html';
                        switch (scope.entryMeta[scope.field]['type']) {
                            case 'integer':
                                field_type = 'number';
                                break;
                            case 'boolean':
                                field_type = 'checkbox';
                                html_template = 'check-box-input.html';
                                break;
                            case 'email':
                                field_type = 'email';
                                break;
                            case 'date':
                                html_template = 'date-input.html';
                                scope.open = function ($event) {
                                    $event.preventDefault();
                                    $event.stopPropagation();
                                    scope.opened = true;
                                };
                                scope.formatDate = function () {
                                    var date = new Date(scope.entry[scope.field]);
                                    scope.entry[scope.field] = [date.getFullYear(),date.getMonth(),date.getDay()].join('-');
                                };
                                scope.dateOptions = {
                                    formatYear: 'yy',
                                    startingDay: 1
                                };
                                scope.format = 'yyyy-MM-dd';
                                break;
                            default:
                                field_type = 'text';
                        }
                        scope.type = field_type;
                    }
                    scope.required = scope.entryMeta[scope.field]['required'];
                    scope.max_length = scope.entryMeta[scope.field]['max_length'];

                    return 'entries/detail/templates/form/fields/' + html_template;
                };
            },
            template: '<div ng-include="getInputUrl()"></div>'
        };
    }]);


angular.module('entries.factory', [])

.factory('Entries', ['$q','api','appConf','NAMES','modalService','emap','mapHelpers','mapDefaults','Notification',
           function ( $q , api , appConf , NAMES , modalService , emap , mapHelpers , mapDefaults , Notification) {
        function getEntryOptions (id) {
            var deferred = $q.defer();
            if (!service.meta) {
                api.entry_large.get_meta({id: id, username: service.username, model:service.model}).$promise.then(function (meta) {
                    service.meta = meta.actions;
                    service.dynamit = meta.dynamit;
                    service.panels = meta.panels;
                    service.baseEntryCount = meta.entry_count;
                    deferred.resolve(meta);
                }).catch(deferred.reject);
            }
            else {
                deferred.resolve(service.meta);
            }
            return deferred.promise;
        }
        var defaultOptions = {
            model: null,
            username: null,
            meta: null,
            dynamit: null,
            panels: null,
            previousEntry: null,
            baseEntryCount: undefined,
            queryEntryCount: undefined,
            entries: [],
            nextPage: null,
            entriesLayerToReturn: null,
            entryIcoToReturn: null,
            entryToUpdate: null,
            panel_collapsed: {},
            queryParam: {
                in_bbox: null,
                in_region: null
            }
        };
        function refresh () {
            for (var fry in defaultOptions){
                if (defaultOptions.hasOwnProperty(fry) && service.hasOwnProperty(fry)) {
                    service[fry] = defaultOptions[fry];
                }
            }
        }
        var service = {};
        angular.extend(service, defaultOptions);
        angular.extend(service, {
            setModel: function(username, model, id) {
                var deferred = $q.defer();
                if (model !== service.model) {
                    modalService.progressbar.show();
                    refresh();
                    service.model = model;
                    service.username = username;
                    getEntryOptions().then(function(meta) {
                        modalService.progressbar.hide();
                        NAMES.title = meta.title.verbose_name;
                    }).catch(function () {
                        appConf.goToMainPage();
                    });
                }
                emap.getEntryJSON(username, model, id).then(function() {
                    deferred.resolve(service.meta);
                });
                return deferred.promise;
            },
            cleanAll: function() {
                refresh();
                emap.modelLayerUrl = '';
                emap.getEntryJSON();
            },
            getPanels: function() {
                var deferred = $q.defer();
                if (!service.panels) {
                    getEntryOptions().then(function(meta) {
                        deferred.resolve(meta.panels);
                    }).catch(deferred.reject);
                }
                else {
                    deferred.resolve(service.panels);
                }
                return deferred.promise;
            },
            getEntries: function() {
                var deferred = $q.defer();
                if (service.entries.length === 0) {
                    var queryParam = {};
                    for (var fry in service.queryParam) {
                        if (service.queryParam.hasOwnProperty(fry)) {
                            queryParam[fry] = service.queryParam[fry];
                        }
                    }
                    queryParam['username'] = service.username;
                    queryParam['model'] = service.model;
                    api.entry.query(queryParam).$promise.then(function (data) {
                        service.nextPage = data.next;
                        service.queryEntryCount = data.count;
                        service.baseEntryCount = data.count > service.baseEntryCount ? data.count : service.baseEntryCount;
                        service.entries = data.results;
                        angular.forEach(service.entries, function (item) {
                            item.entryListName = service.entryListName(item);
                        });
                        deferred.resolve();
                    }).catch(deferred.reject);
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            },
            getEntriesOptions: function() {
                var deferred = $q.defer();
                api.entry.get_meta({model:service.model}).$promise.then(function (data) {
                    deferred.resolve();
                }).catch(deferred.reject);
                return deferred.promise;
            },
            get: function(username, model, id) {
                var deferred = $q.defer();
                api.entry_large.get({id: id, model: model, username: username }).$promise.then(function (data) {
                    service.previousEntry = data;
                    emap.sidebarClick(data.id);
                    if (data.geom) {
                        if (data.geom.type === 'Point') {
                            data.coordinates = data.geom.coordinates[1].toFixed(4) + ' ' + data.geom.coordinates[0].toFixed(4);

                            var selectedIco = mapHelpers.findInMapLayer(data.id, emap.markerClusters);
                            if (selectedIco) {
                                selectedIco.setIcon(mapDefaults.singleCurrentIcon);
                                service.entryIcoToReturn = selectedIco;
                            }
                        }
                    }
                    deferred.resolve(data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            create: function(data) {
                var deferred = $q.defer();
                api.entry_large.create({model: service.model, username: service.username}, data).$promise.then(function (data) {
                    if (service.entries.length !== 0) {
                        service.entries.unshift(data);
                        data.entryListName = service.entryListName(data);
                    }
                    deferred.resolve(data);
                }).catch(function (error) { deferred.reject(error);});
                return deferred.promise;
            },
            update: function(id, data) {
                var deferred = $q.defer();
                api.entry_large.update({id:id, model:service.model, username: service.username}, data).$promise.then(function (data) {
                    service.entriesLayerToReturn = null;
                    deferred.resolve(data);
                }).catch(function (error) { deferred.reject(error);});
                return deferred.promise;
            },
            deleteEntry: function (id, name) {
                var deferred = $q.defer();
                var bodyText = !name ? '' : 'Вы действительно хотите удалить ' +  NAMES.entry.name +': '+name+'?';
                modalService.showConfirm(bodyText)
                    .then(function (result) {
                    api.entry_large.delete({id: id, model:service.model, username: service.username}).$promise.then(function () {
                        service.entriesLayerToReturn = null;
                        service.entryIcoToReturn = null;
                        if (service.entries.length !== 0) {
                            service.entries.splice(appConf.getElementIndex(id, service.entries), 1);
                        }
                        emap.removeMarkerFromLayer(id);
                        Notification.success("Объект удалён");
                        deferred.resolve();
                    }).catch(deferred.reject);
                });
                return deferred.promise;
            },
            entryListName :  function(entry) {
                var first_part = '';
                if (NAMES.entry.short_name) {
                    first_part = NAMES.entry.short_name +': ';
                }
                var nameForListItem;
                if (entry.entryid) {
                    nameForListItem =  first_part + entry.entryid;
                }
                else {
                    nameForListItem =  first_part + entry.id;
                }
                return nameForListItem;
            }
        });
        return service;
    }]);


angular.module('entries', ['entries.list', 'entries.detail', 'entries.factory','entries.dynamit'])

.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'entries/manager/templates/sidebar.html',
            controller: 'DynamitListCtrl'
        })
        .when('/:username/layer/:model', {
            templateUrl: 'entries/sidebar.html',
            controller: 'EntryListCtrl'
        })
        .when('/:username/layer/:model/create', {
            templateUrl: 'entries/detail/templates/detail.html',
            controller: 'EntryDetailCtrl'
        })
        .when('/:username/layer/:model/:id', {
            templateUrl: 'entries/detail/templates/detail.html',
            controller: 'EntryDetailCtrl'
        });
}])

.run(['$rootScope', '$routeParams','appConf','Entries', 'emap', 'mapDefaults',
        function ($rootScope, $routeParams, appConf, Entries, emap, mapDefaults) {
    $rootScope.$on("$locationChangeSuccess", function (event, next, current) {
        emap.disableDraw();
        emap.disableEdit();
        if (Entries.entryToUpdate && Entries.entries.length !== 0) {
            var data = Entries.entryToUpdate;
            for (var fry = 0; fry < Entries.entries.length; fry++) {
                if (Entries.entries[fry].id === data.id) {
                    data.entryListName = Entries.entryListName(data);
                    Entries.entries[fry] = data;
                    break;
                }
            }
        }
        if (Entries.entriesLayerToReturn) {
            emap.returnLayerBack(Entries.entriesLayerToReturn);
            Entries.entriesLayerToReturn = null;
        }
        if (Entries.entryIcoToReturn) {
            Entries.entryIcoToReturn.setIcon(mapDefaults.singleIcon);
        }
        //addressExampleItems.clearLayers();
        emap.clearDrawItems();
        //highlight.clearLayers();
        var queryType = null;
        var _getParamInQuery = function (from_query_str) {
            for (var fry in Entries.queryParam) {
                if (Entries.queryParam.hasOwnProperty(fry)) {
                    var urlParam = appConf.getUrlParameters(fry, from_query_str, true);
                    if (urlParam) {
                        queryType = fry;
                        return urlParam;
                    }
                }
            }
            return null;
        };
        var currentQuery = _getParamInQuery(current);
        var nextQuery = _getParamInQuery(next);
        for (var q in Entries.queryParam) {
            if (Entries.queryParam.hasOwnProperty(q)) {
                if (currentQuery && nextQuery == null) {
                    Entries.queryParam[q] = null;
                }
                else if (q === queryType) {
                    Entries.queryParam[q] = nextQuery ? nextQuery : currentQuery;
                }
                else {
                    Entries.queryParam[q] = null;
                }
            }
        }
        if ((nextQuery || currentQuery) && (nextQuery !== currentQuery)) {
            Entries.entries = [];
            if (!emap.map.hasLayer(emap.markerClusters)) {
                emap.map.addLayer(emap.markerClusters);
            }
            //angular.element("#loading").show();
            emap.clearRegionLayer();
            emap.markerClusters._unspiderfy();
            //emap.redrawMap(Entries.model);
        }
    });
}]);

angular.module('entries.list', [])

.controller('EntryListCtrl', ["$scope","$routeParams","$http","Entries",
                     function( $scope , $routeParams , $http , Entries ) {
        Entries.setModel($routeParams.username, $routeParams.model);
        $scope.loadingBtn = {
                btn: angular.element('.show-more-btn'),
                loading: function() {
                    this.btn.button('loading');
                },
                reset: function() {
                    this.btn.button('reset');
                }
            };
        $scope.init = function () {
            $scope.loadingBtn.loading();
            Entries.getEntries().then(function(){
                $scope.entries = Entries.entries;
                $scope.nextPage = Entries.nextPage;
            });
            if (Entries.previousEntry) {
                setTimeout(function () {
                    var $sidebarBody = angular.element('.sidebar-body');
                    var $elem = angular.element('#entry-' + Entries.previousEntry.id);
                    if ($elem.length > 0) {
                        $sidebarBody.scrollTop($sidebarBody.scrollTop() + $elem.position().top - 5);
                        $elem.addClass('previous-entry');
                        Entries.previousEntry = null;
                    }
                }, 1);
            }
            $scope.loadingBtn.reset();
        };
        $scope.init();
        $scope.nextPage = Entries.nextPage ? Entries.nextPage: null;
        $scope.showMore = function() {
            if ($scope.nextPage) {
                $scope.loadingBtn.loading();
                $http.get($scope.nextPage)
                    .then(function (res) {
                        var data = res.data;
                        Entries.nextPage = $scope.nextPage = data.next;
                        angular.forEach(data.results, function (item) {
                            item.entryListName = Entries.entryListName(item);
                            $scope.entries.push(item);
                        });
                        Entries.entries = $scope.entries;
                        $scope.loadingBtn.reset();
                    });
            }
        };
    }])

.directive("entriesList", [function() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'entries/list/templates/entries-list.html'
    };
}])

.directive("entryInList", ["Entries","appConf", function(Entries, appConf) {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'entries/list/templates/entry-in-list.html',
        link: function(scope, element) {
            scope.deleteEntry = function(id, entryid){
                Entries.deleteEntry(id, entryid);
            };
            scope.startEdit = function(id) {
                Entries.editmode = true;
                appConf.goToDetail(Entries.username, Entries.model, id);
            };
        }
    };
}]);

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
angular.module('mapster')
    .factory('emap', ['$q','$injector','$window', '$location', '$http','mapDefaults', 'mapHelpers', 'modalService','NAMES',
        function ($q, $injector, $window, $location, $http, mapDefaults, mapHelpers, modalService, NAMES) {
            var mapcursor;
            var L = $window.L;
            var withExtend = true;
            var mapOptions = mapDefaults.mapDefaults;
            var Entries;
            function getEntries() {
                if (!Entries) {
                    Entries = $injector.get('Entries');
                }
            }
            function isTight() {
                return $window.innerWidth < 767;
            }

            var entryOSM = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
            var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
            });
            var short_name = NAMES.entry.short_name ? NAMES.entry.short_name + ':': '';
            var entryLayer = L.geoJson(null, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: mapDefaults.singleIcon,
                        title: short_name + feature.properties.entryid,
                        riseOnHover: true
                    });
                },
                onEachFeature: function (feature, layer) {
                    getEntries();
                    if (feature.properties) {
                        layer.on("click", function(e){
                            //$window.location.href = '#/'+Entries.model+'/'+feature.id;
                            //$location.path('/' + Entries.model + '/' + feature.id);
                            $window.location.href = mapHelpers.getParametersUrl('#/'+
                            Entries.username+'/layer/'+Entries.model+'/'+feature.id);
                        });
                    }
                }
            });

            var regionLayer = L.geoJson(null, {
                fillOpacity: 0
            });

            var addressExampleItems = L.geoJson(null);

            var drawnItems = new L.FeatureGroup();

            var searchBox = new L.FeatureGroup();

            var markerClusters = L.markerClusterGroup({
                maxClusterRadius: 20,
                iconCreateFunction: function (cluster) {
                    return L.divIcon({
                        iconSize: [30, 40],
                        iconAnchor: [15, 40],
                        popupAnchor: [-3, -76],
                        html: cluster.getChildCount(),
                        className: 'mycluster'
                    });
                },
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            });

            function clearAllLayer () {
                redrawEntryLayer();
                service.map.removeLayer(entryLayer);
                var layers = [drawControl, entryLayer, drawnItems, regionLayer, markerClusters];
                for (var fry=0; fry<layers.length; fry++){
                    if (service.map.hasLayer(layers[fry])) {
                        layers[fry].clearLayers();
                    }
                }
            }

            var drawControl = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    circle: false,
                    rectangle: {
                        metric: true,
                        showArea: false,
                        shapeOptions: {
                            clickable: false
                        }
                    },
                    marker: {
                        icon: mapDefaults.singleCurrentIcon
                    }
                },
                edit: {
                    featureGroup: drawnItems,
                    selectedPathoptions: {
                        maintainColor: true,
                        opacity: 0.3
                    }
                }
            });

            angular.extend(mapOptions, {
                maxZoom: 18,
                zoom: 6,
                layers: [entryOSM, markerClusters, drawnItems, regionLayer, addressExampleItems, searchBox]
            });

            function getMapHeight() {
                var mapid = angular.element(service.map._container.id);
                var height = angular.element("#map").css("height");
                return height;
            }

            var activeAreaOptions = {
                position: "absolute",
                top: "0px",
                left: "0px",
                right: "0px",
                height: "100px"
            };


            function getViewport() {
                var width = angular.element(".leaflet-sidebar").css("width");
                var height = getMapHeight();
                var options;
                if (service.sidebar.isVisible()) {
                    options = angular.extend(activeAreaOptions, {left: width, height: height});
                    service.setActiveArea(options);
                } else {
                    options = angular.extend(activeAreaOptions, {height: height, left: "0px"});
                }
                service.setActiveArea(options);
            }
            var sidebar;

            function setSidebar() {
                sidebar = L.control.sidebar("sidebar", {
                    closeButton: true,
                    position: "left"
                });
                return sidebar;
            }

            function checkSidebarIsNarrow(sidebar) {
                var width = angular.element(".leaflet-sidebar")[0];
                if (width!==undefined) {
                    width = width.clientWidth;
                    if (width) {
                        return width < 390;
                    }
                }
                return false;
            }

            function sidebarClick(id) {
                var layer;
                var features = markerClusters.getLayers();
                for (var fry = 0; fry < features.length; fry++) {
                    if (features[fry].feature.id === id) {
                        layer = features[fry];
                        break;
                    }
                }
                if ($window.innerWidth <= 767) {
                    if (!sidebar.isVisible()) {
                        sidebar.show();
                    }
                }
                else {
                    sidebar.show();
                }
                getViewport(service.map);
                clickToLayer(layer);
            }

            function clickToLayer(layer) {
                if (layer) {
                    if (layer.feature.geometry.type === 'Point') {
                        var latlng = [layer.getLatLng().lat, layer.getLatLng().lng];
                        var latLngGeom = [layer.feature.geometry.coordinates[0], layer.feature.geometry.coordinates[1]];
                        var parentMarkers = layer.__parent._markers;
                        if (parentMarkers.length > 1) {
                            var brothers = [];
                            for (var fry = 0; fry < parentMarkers.length; fry++) {
                                var brotherLatLngGeom = [
                                    parentMarkers[fry].feature.geometry.coordinates[0],
                                    parentMarkers[fry].feature.geometry.coordinates[1]];
                                var inOneCluster = parentMarkers.length > 5 ? true : latLngGeom.join(',') === brotherLatLngGeom.join(',');
                                if (parentMarkers[fry].feature.id && inOneCluster) {
                                    brothers.push(parentMarkers[fry].feature.id);
                                }
                            }
                            if (brothers.length > 1) {
                                mapHelpers.applyScope('feature', {'brothers': brothers});
                            }
                        }
                        markerClusters.zoomToShowLayer(layer, function () {
                            service.map.setView(latlng);
                        });
                    }
                    else {
                        service.map.fitBounds(layer.getBounds());
                    }
                }
            }

            /* Leaflet Draw */
            L.drawLocal.draw.handlers.marker.tooltip.start = 'Нажмите на карту, чтобы поместить маркер.';
            L.drawLocal.edit.handlers.edit.tooltip.text = 'Нажмите на маркер и перемещайте мышь.';
            L.drawLocal.edit.handlers.edit.tooltip.subtext = false;
            L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Рисуйте прямоугольник<br> с зажатой кнопкой';
            L.drawLocal.draw.handlers.simpleshape.tooltip.end = 'Отпустите кнопку для завершения';

            function initDrawMode(map) {
                return new L.Draw.Marker(map, drawControl.options.draw.marker);
            }

            function initGeomEditMode(map) {
                return new L.EditToolbar.Edit(map, {
                    featureGroup: drawControl.options.edit.featureGroup
                });
            }

            function initBboxSearchMode(map) {
                return new L.Draw.Rectangle(map, drawControl.options.draw.rectangle);
            }

            function returnLayerBack(layer) {
                drawnItems.clearLayers();
                markerClusters.removeLayer(entryLayer);
                entryLayer.addData(layer);
                markerClusters.addLayer(entryLayer);
            }

            function removeMarkerFromLayer(id) {
                mapHelpers.findInMapLayerAndRemove(id, entryLayer);
                mapHelpers.findInMapLayerAndRemove(id, markerClusters);
            }

            function redrawEntryLayer() {
                markerClusters.removeLayer(entryLayer);
                markerClusters.addLayer(entryLayer);
            }

            function refreshMapData(model) {
                redrawMap(model);
                entryLayer.clearLayers();
                angular.element("#feature-list").find("tbody").empty();
            }

            function redrawMap(model, bbox) {
                bbox = (bbox !== undefined) ? bbox : '';
                markerClusters.removeLayer(entryLayer);
                entryLayer.clearLayers();
                getEntryJSON(model, bbox);
            }

            function getEntryJSON(username, model, id) {
                var deferred = $q.defer();
                var url = mapHelpers.getParametersUrl("/api/geomodel/" + username +'/'+ model);
                if (service.modelLayerUrl !== url) {
                    service.map.removeLayer(entryLayer);
                    //clearAllLayer();
                    markerClusters.clearLayers();
                    entryLayer.clearLayers();
                    if (model) {
                        $http.get(url)
                            .success(function (data) {
                                entryLayer.addData(data);
                                markerClusters.addLayer(entryLayer);
                                if (data.region) {
                                    regionLayer.clearLayers();
                                    var multiPolygon = {
                                        "type": "Feature",
                                        "properties": {},
                                        "geometry": JSON.parse(data.region)
                                    };
                                    regionLayer.addData(multiPolygon);
                                }
                                if (data.features.length) {
                                    if (id) {
                                    //icon selection moved to entries service
                                    }
                                    else if (withExtend) {
                                        renderEntry();
                                    }
                                    withExtend = true;
                                    modalService.progressbar.hide();
                                }
                                service.modelLayerUrl = url;
                                deferred.resolve();
                            })
                            .catch(function () {
                                modalService.progressbar.hide();
                                deferred.reject();
                            });
                    }
                    else {
                        deferred.reject();
                    }
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function renderEntry() {
                if (regionLayer.getLayers().length) {
                    service.map.fitBounds(regionLayer.getBounds());
                }
                else if (entryLayer.getBounds() && entryLayer.getBounds()._northEast !==undefined) {
                    service.map.fitBounds(entryLayer.getBounds());
                }
            }
            var regionSearch = {
                onClick: function (e) {
                    var latlng = e.latlng;
                    var zoomlevel = map.getZoom();
                    var query = '?in_region=' + latlng.lat + ',' + latlng.lng + ',' + zoomlevel;
                    angular.element('#map').css('cursor', mapcursor);
                    $location.path('/' + query);

                },
                enable: function () {
                    map.on('click', this.onClick);
                },
                disable: function () {
                    map.off('click', this.onClick);
                    angular.element('#map').css('cursor', mapcursor);
                },
                once: function () {
                    var $map = angular.element('#map');
                    mapcursor = $map.css('cursor');
                    $map.css('cursor', 'crosshair');
                    map.once('click', this.onClick);
                }

            };

            function getAddressExampleFromMap(layer) {
                addressExampleItems.clearLayers();
                var url = "/osm/map_address/" + layer.getLatLng().lat + "/" + layer.getLatLng().lng + "/";
                $http.get(url)
                    .then(function (resp) {
                        var data = resp.data;
                        if (data[0].features && data[0].features.length) {
                            mapHelpers.applyScope('id_geom', {'autofill': data[0].features[0]});
                        }
                        addressExampleItems.addData(data);
                    });
                }

            function ifMap(f) {
                return function () {
                    if (service.map) {
                        f();
                    }
                };
            }

            var service = {
                map: null,
                modelLayerUrl: null,
                drawMode: null,
                geomEditMode: null,
                bboxSearchMode: null,
                drawControl: drawControl,
                entryLayer: entryLayer,
                drawnItems: drawnItems,
                regionLayer: regionLayer,
                markerClusters: markerClusters,
                sidebar: null,
                sidebar_is_narrow: false,
                setActiveArea: function(options) {
                    options = options || activeAreaOptions;
                    service.map.setActiveArea(options);
                },
                showFullExtent: function() {
                    service.map.fitBounds(service.entryLayer.getBounds());
                },
                redrawMap: function(bbox) {
                    redrawMap(bbox);
                },
                disableDraw: function () {
                    ifMap(service.drawMode.disable)();
                },
                disableEdit: function () {
                    ifMap(service.geomEditMode.disable)();
                },
                returnLayerBack: function (layer) {
                    returnLayerBack(layer);
                },
                redrawEntryLayer: function() {
                    redrawEntryLayer();
                },
                removeMarkerFromLayer: function(id) {
                    removeMarkerFromLayer(id);
                },
                clearDrawItems: function () {
                    if (service.map.hasLayer(drawnItems)) {
                        service.drawnItems.clearLayers();
                    }
                },
                clearRegionLayer: function () {
                    if (service.map.hasLayer(regionLayer)) {
                        service.regionLayer.clearLayers();
                    }
                },
                clearAllLayer: function() {
                    clearAllLayer();
                },
                clickToLayer: function(layer) {
                    clickToLayer(layer);
                },
                sidebarClick: function (id) {
                    sidebarClick(id);
                },
                showSidebar: function() {
                    service.sidebar.show();
                },
                hideSidebar: function() {
                    service.sidebar.hide();
                },
                toggleSidebar: function() {
                    service.sidebar.toggle();
                },
                checkSidebarIsNarrow: function() {
                    service.sidebar_is_narrow = checkSidebarIsNarrow();
                    return service.sidebar_is_narrow;
                },
                getEntryJSON: function (username, model, id) {
                    var deferred = $q.defer();
                    getEntryJSON(username, model, id).then(function() {
                            deferred.resolve();
                        }).catch(deferred.reject);
                    return deferred.promise;
                },
                init: function (id) {
                    service.map = L.map(id, mapOptions);
                    var map = service.map;
                    map.fitBounds([
                        [35, 0],
                        [76, 180]
                    ]);
                    service.drawMode = initDrawMode(map);
                    service.geomEditMode = initGeomEditMode(map);
                    service.bboxSearchMode = initBboxSearchMode(map);
                    service.sidebar = setSidebar();
                    service.sidebar.addTo(map);

                    map.on("click", function (e) {
                        if ($window.innerWidth <= 767) {
                            service.sidebar.hide();
                        }
                    });
                    map.on('draw:created', function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            var layer = e.layer;
                            mapHelpers.applyScope('id_geom', {
                                'geom': mapHelpers.toWKT(layer),
                                'drawNewMarkerMode': false,
                                'entry.coordinates': layer.getLatLng().lat.toFixed(4) + " " + layer.getLatLng().lng.toFixed(4)
                            });
                            drawnItems.addLayer(layer);
                            //getAddressExampleFromMap(layer);
                        }
                        else if (service.bboxSearchMode.enabled()) {
                            var layerBounds = e.layer.getBounds();
                            var southWest = layerBounds._southWest;
                            var northEast = layerBounds._northEast;
                            var bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
                            bbox = '?in_bbox=' + bbox.join(',');
                            getEntries();
                            if (Entries) {
                                $window.location.href = '#/'+Entries.username +'/layer/'+ Entries.model + bbox;
                            }
                        }
                    });
                    map.on('draw:edited', function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            var layers = e.layers;
                            layers.eachLayer(function (layer) {
                                getAddressExampleFromMap(layer);
                                mapHelpers.applyScope('id_geom', {
                                    'geom': mapHelpers.toWKT(layer),
                                    'entry.coordinates': layer.getLatLng().lat.toFixed(4) + " " + layer.getLatLng().lng.toFixed(4)
                                });
                            });
                        }
                    });
                    map.on("draw:drawstop", function (e) {
                        if (service.drawMode.enabled() || service.geomEditMode.enabled()) {
                            mapHelpers.applyScope('id_geom', {'drawNewMarkerMode': false});
                        }
                    });

                    L.control.attribution({
                            position: 'bottomright',
                            prefix: ''
                        }).addTo(map);

                    L.control.zoom({
                        position: "bottomright"
                    }).addTo(map);

                    var baseLayers = {
                        "Карта": entryOSM,
                        "Спутник": Esri_WorldImagery
                        //"Гибрид": mapquestHYB
                    };

                    var groupedOverlays = {};

                    groupedOverlays[mapDefaults.EntryOverlaysHtml] = markerClusters;
                    L.control.layers(baseLayers, groupedOverlays, {
                        collapsed: isTight()
                    }).addTo(map);

                    var sidebar = service.sidebar;
                    if (!isTight()) {
                        sidebar.show();
                    }
                    getViewport();
                    service.sidebar.on("shown", function () {
                        getViewport();
                    }).on("hidden", function () {
                        getViewport();
                    });
                    service.sidebar_is_narrow = checkSidebarIsNarrow();
                }
            };
            return service;
        }]);
angular.module('mapster')
    .factory('mapDefaults',['NAMES', function (NAMES) {
        function controlDefaults() {
            return {
                zoom: true,
                fullscreen: true,
                layers: true,
                scale: true,
                measure: false,
                loading: true,
                coordinate: false,
                zoomBox: false,
                bookmarks: false,
                draw: false
            };
        }

        function mapDefaults() {
            return {
                // Default
                center: [55.5, 38.0],
                zoom: 5,
                //layers: layers
                minZoom: undefined,
                maxZoom: undefined,
                maxBounds: undefined,
                dragging: true,
                touchZoom: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                trackResize: true,
                closePopupOnClick: true,
                zoomControl: false,
                attributionControl: false
            };
        }

        var imagePath = '/static/img/';

        var SingleIcon = L.Icon.extend({
            options: {
                iconSize: [20, 26],
                iconAnchor: [10, 26],
                popupAnchor: [-3, -76],
                shadowUrl: imagePath+'shadow.svg',
                shadowRetinaUrl: imagePath+'shadow.svg',
                shadowSize: [18, 6],
                shadowAnchor: [0, 9]
            }
        });

        var singleCurrentIcon = new SingleIcon({
            iconUrl: imagePath+'single_current.svg',
            iconRetinaUrl: imagePath+'single_current.svg'
        });

        var singleIcon = new SingleIcon({
            iconUrl: imagePath+'single_stroke.svg',
            iconRetinaUrl: imagePath+'single_stroke.svg'
        });


        var service = {
            singleIcon: singleIcon,
            singleCurrentIcon: singleCurrentIcon,
            mapDefaults: mapDefaults(),
            controlDefaults: controlDefaults(),

            EntryOverlaysHtml: "<img src='"+ imagePath +
                        "single_stroke.svg' width='20' height='26'>&nbsp;"+NAMES.entry.short_name
        };
        return service;
    }]);
angular.module('mapster').service('mapHelpers', ['appConf', function (appConf) {
    return {
        getParametersUrl: function (from_url) {
            var param;
            var params = ['in_bbox', 'in_region'];
            for (var fry = 0; fry < params.length; fry++) {
                param = appConf.getUrlParameters(params[fry], "", true);
                if (param) {
                    param = param ? '?' + params[fry] + '=' + param : param;
                    break;
                }
            }
            return from_url + param;
        },
        findInMapLayer: function (id, layer) {
            /**
             * @return {object} layer
             * @param  {int}    id      element id
             * @param  {object} layer   features layer where to look for
             */
            var features = layer.getLayers();
            for (var p = 0; p < features.length; p++) {
                if (features[p].feature.id === id) {
                    return features[p];
                }
            }
            return null;
        },
        findInMapLayerAndRemove: function (id, layer) {
            var feature = this.findInMapLayer(id, layer);
            if (feature) {
                layer.removeLayer(feature);
                return feature;
            }
            return null;
        },

        goToOSM: function (map) {
            var mapCenter = map.getCenter();
            var mapZoom = map.getZoom();
            var osmurl = 'http://openstreetmap.ru/';
            window.open(osmurl + '#map=' + mapZoom + '/' + mapCenter.lat.toFixed(3) + '/' + mapCenter.lng.toFixed(3));
        },

        applyScope: function (elem, apply) {
            /**
             * change AngularJS data outside the scope
             * @param {string} elem Dom ID under ngController
             * @param {object} apply Dict of scope param to change
             */
            var feature = document.getElementById(elem);
            if (feature) {
                var scope = angular.element(feature).scope();
                scope.safeApply = function (fn) {
                    var phase = this.$root.$$phase;
                    if (phase === '$apply' || phase === '$digest') {
                        if (fn && (typeof(fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };
                scope.safeApply(function () {
                    for (var fry in apply) {
                        if (apply.hasOwnProperty(fry)) {
                            var key_name = fry.split(".");
                            if (key_name.length === 1) {
                                scope[fry] = apply[fry];
                            }
                            else if (key_name.length === 2) {
                                scope[key_name[0]][key_name[1]] = apply[fry];
                            }
                        }
                    }
                });
            }
        },
        createGeoJsonEntry: function (id, geom) {
            /**
             * create geoJson feature from WKT (POST responce)
             * @param {int} id entry.id
             * @param {object} geom wkt geom
             */
            return {
                "type": "Feature",
                "id": id,
                "properties": {
                    "id": id
                },
                "geometry": {
                    "type": geom.type,
                    "coordinates": geom.coordinates
                }
            };
        },

        toWKT: function (layer) {
            var lng, lat, coords = [];
            if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                var latlngs = layer.getLatLngs();
                for (var i = 0; i < latlngs.length; i++) {
                    coords.push(latlngs[i].lng + " " + latlngs[i].lat);
                    if (i === 0) {
                        lng = latlngs[i].lng;
                        lat = latlngs[i].lat;
                    }
                }
                if (layer instanceof L.Polygon) {
                    return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
                } else if (layer instanceof L.Polyline) {
                    return "LINESTRING(" + coords.join(",") + ")";
                }
            } else if (layer instanceof L.Marker) {
                return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
            }
        }
    };
}]);
angular.module('templates.app', ['common/auth/login/login-form.html', 'common/auth/login/logout-form.html', 'common/auth/login/register-form.html', 'common/auth/login/toolbar.html', 'common/comment/templates/comment.html', 'common/comment/templates/comments.html', 'common/gallery/templates/gallery.html', 'common/gallery/templates/image.html', 'common/modal/templates/dialog.html', 'common/modal/templates/progress.html', 'common/print/print-table.html', 'common/toolbar/templates/toolbar.html', 'entries/detail/templates/detail.html', 'entries/detail/templates/form-widget/addr-input-auto-code.html', 'entries/detail/templates/form-widget/addr-input-auto-regioncode.html', 'entries/detail/templates/form-widget/addr-input-autocomplete.html', 'entries/detail/templates/form/fields/check-box-input.html', 'entries/detail/templates/form/fields/date-input.html', 'entries/detail/templates/form/fields/geom.html', 'entries/detail/templates/form/fields/input.html', 'entries/detail/templates/form/fields/latlng.html', 'entries/detail/templates/form/fields/time-input.html', 'entries/detail/templates/form/fields/typeahead-input.html', 'entries/detail/templates/form/form.html', 'entries/list/templates/entries-list.html', 'entries/list/templates/entries-table.html', 'entries/list/templates/entry-in-list.html', 'entries/manager/editor/base-form.html', 'entries/manager/editor/dynamit-field.html', 'entries/manager/editor/dynamit-fields.html', 'entries/manager/editor/dynamit-options.html', 'entries/manager/editor/editor-modal.html', 'entries/manager/templates/dynamit-in-list.html', 'entries/manager/templates/dynamit-list.html', 'entries/manager/templates/sidebar.html', 'entries/sidebar.html']);

angular.module("common/auth/login/login-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/login-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Войти</h4>\n" +
    "        </div>\n" +
    "        <form id=\"id_auth_form\">\n" +
    "            <div class=\"modal-body\">\n" +
    "                <fieldset>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label for=\"username\">Имя пользователя:</label>\n" +
    "                            <input ng-model=\"auth_user.username\" name=\"username\" required type=\"text\" class=\"form-control\" autofocus>\n" +
    "\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label for=\"password\">Пароль:</label>\n" +
    "                            <input ng-model=\"auth_user.password\" name=\"password\" required type=\"password\" class=\"form-control\">\n" +
    "                    </div>\n" +
    "                </fieldset>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "                <button type=\"submit\" ng-click=\"login()\" class=\"btn btn-primary\">Войти</button>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/logout-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/logout-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Выход</h4>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"modal-body\">\n" +
    "            <p>Вы уверены что хотите выитй?</p>\n" +
    "        </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "            <button type=\"button\" class=\"btn btn-default\" ng-click=\"cancel()\">Отмена</button>\n" +
    "            <button type=\"submit\" class=\"btn btn-primary\" ng-click=\"logout()\">Выйти</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/register-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/register-form.html",
    "<div class=\"modal-content\">\n" +
    "    <div>\n" +
    "        <div class=\"modal-header\">\n" +
    "            <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "            <h4 class=\"modal-title\">Регистрация</h4>\n" +
    "        </div>\n" +
    "        <form name=\"registerForm\">\n" +
    "            <div class=\"modal-body\">\n" +
    "                <fieldset>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.username.$invalid }\">\n" +
    "                        <label for=\"username\">Имя пользователя:</label>\n" +
    "                        <input ng-model=\"auth_user.username\" name=\"username\" required type=\"text\" autofocus\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.email.$invalid }\">\n" +
    "                        <label for=\"password\">Почта:</label>\n" +
    "                        <input ng-model=\"auth_user.email\" name=\"email\" required type=\"email\" server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.password.$invalid }\">\n" +
    "                        <label for=\"password\">Пароль:</label>\n" +
    "                        <input ng-model=\"auth_user.password\" name=\"password\" required type=\"password\"\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\" ng-class=\"{'has-error': registerForm.password2.$invalid }\">\n" +
    "                        <label for=\"password\">Подтверждение пароля:</label>\n" +
    "                        <input ng-model=\"auth_user.password2\" name=\"password2\" required type=\"password\"\n" +
    "                               ng-minlength=\"4\"\n" +
    "                               ng-maxlength=\"50\"\n" +
    "                               server-error\n" +
    "                               class=\"form-control\">\n" +
    "                    </div>\n" +
    "                </fieldset>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "                <button type=\"submit\" ng-click=\"register()\" class=\"btn btn-primary\" ng-disabled=\"registerForm.$invalid\">\n" +
    "                    Зарегистрироваться\n" +
    "                </button>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("common/auth/login/toolbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/auth/login/toolbar.html",
    "<ul ng-cloak class=\"nav navbar-nav navbar-right container-fluid\">\n" +
    "    <li ng-show=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"logout()\">\n" +
    "            <i class=\"fa fa-power-off\"></i>&nbsp;&nbsp;{$ auth.user $}\n" +
    "        </a>\n" +
    "    </li>\n" +
    "    <li ng-hide=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"register()\">Регистрация\n" +
    "        </a>\n" +
    "    </li>\n" +
    "    <li ng-hide=\"auth.user\">\n" +
    "        <a href=\"\"\n" +
    "           class=\"animate menu-item\" ng-click=\"login()\">\n" +
    "            <i class=\"fa fa-user\"></i>&nbsp;&nbsp;Вход\n" +
    "        </a>\n" +
    "    </li>\n" +
    "</ul>");
}]);

angular.module("common/comment/templates/comment.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/comment/templates/comment.html",
    "<div class=\"comment-block\">\n" +
    "    <div ng-hide=\"comment.editModeOn\">\n" +
    "        <p>{$ c.comment |limitTo: c.textLength $}\n" +
    "            <a ng-if=\"c.comment.length>=comments.commentLenght\" ng-click=\"changeCommentLength(c)\" class=\"show-more\">\n" +
    "                {$ c.readMoreText $}\n" +
    "            </a>\n" +
    "        </p>\n" +
    "        <span class=\"date sub-text\">{$ c.submit_date | date:'yyyy-MM-dd HH:mm'$}&nbsp;|</span>\n" +
    "        <span class=\"user sub-text\">&nbsp;{$ c.user $}&nbsp;</span>\n" +
    "        <span ng-if=\"auth.user == c.user || auth.is_superuser\">|&nbsp;\n" +
    "          <a href=\"\" ng-click=\"deleteComment(c.id)\"><i class=\"fa fa-trash-o delete-comment-btn\"></i></a>&nbsp;&nbsp;\n" +
    "        </span>\n" +
    "        <span ng-if=\"auth.user == c.user || auth.is_superuser\">|&nbsp;\n" +
    "          <a href=\"\" ng-click=\"editComment(comment)\"><i class=\"fa fa-pencil\"></i></a>&nbsp;&nbsp;\n" +
    "        </span>\n" +
    "    </div>\n" +
    "    <div ng-show=\"comment.editModeOn\" class=\"form-group\">\n" +
    "        <div>\n" +
    "            <form name=\"entryForm\" class=\"form-horizontal\" role=\"form\">\n" +
    "                <div>\n" +
    "                    <textarea class=\"form-control\" ng-model=\"c.comment\" id=\"description\" rows=\"2\" name=\"comment\" style=\"resize:vertical;\"></textarea>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "        <div style=\"margin-top: 5px\">\n" +
    "            <button class=\"btn btn-default pull-right\" ng-click=\"updateComment(c)\">Изменить комментирий</button>\n" +
    "            <button class=\"btn btn-default\" ng-click=\"cancelCommentEditing(comment)\">Отмена</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("common/comment/templates/comments.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/comment/templates/comments.html",
    "<div ng-show=\"comments.comments.length && enable\" class=\"comment-modal\">\n" +
    "    <a ng-if=\"comments.comments.length>1\" class=\"show-more more-comments\" ng-click=\"showAllComments()\">\n" +
    "        <div ng-show=\"comments.commentsLimit == comments.beginCommentsLimit\" >\n" +
    "            <span class=\"more-link\" tabindex=\"0\">\n" +
    "                <span class=\"link-text\">Показать&nbsp;комментарии&nbsp;({$ comments.comments.length $})&nbsp;</span>\n" +
    "            </span>\n" +
    "            <div class=\"more-arrow\">\n" +
    "                <i class=\"fa fa-angle-down more-arrow-img\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-hide=\"comments.commentsLimit == comments.beginCommentsLimit\">\n" +
    "            <span class=\"more-link\" tabindex=\"0\">\n" +
    "                <span ng-hide=\"comments.commentsLimit == comments.beginCommentsLimit\" class=\"link-text\">Скрыть комментарии&nbsp;</span>\n" +
    "            </span>\n" +
    "            <div class=\"more-arrow\">\n" +
    "                <i class=\"fa fa-angle-up more-arrow-img\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </a>\n" +
    "    <ul class=\"comment-list\" id=\"entry-comment-list\">\n" +
    "        <li ng-repeat=\"comment in comments.comments | limitTo:comments.commentsLimit\" class=\"animate animate-item\">\n" +
    "            <div data-comment-item data-comment=\"comment\" data-comment-lenght=\"commentLenght\"></div>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div>");
}]);

angular.module("common/gallery/templates/gallery.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/gallery/templates/gallery.html",
    "<div class=\"gallery-widget\"\n" +
    "     ng-file-drop\n" +
    "     ng-file-change=\"upload($files)\"\n" +
    "     drag-over-class=\"dragover\"\n" +
    "     ng-multiple=\"true\"\n" +
    "     accept=\".jpg, .png, .tiff\">\n" +
    "\n" +
    "    <div ng-show=\"images && images.length\">\n" +
    "        <ul rn-carousel >\n" +
    "            <li ng-repeat=\"image in images\">\n" +
    "                <div ng-style=\"{'background-image': 'url(' + image.thumb + ')'}\" class=\"bgimage\">\n" +
    "                    <a  ng-if=\"canedit\" href=\"\" ng-click=\"deleteImage(image.id)\">\n" +
    "                        <i class=\"fa fa-trash-o delete-image-btn\"></i></a>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "    <div class=\"app-photos\"\n" +
    "         ng-file-select\n" +
    "         ng-file-change=\"upload($files)\"\n" +
    "         ng-multiple=\"true\"\n" +
    "         accept=\".jpg, .png, .tiff\"\n" +
    "         ng-if=\"canedit\">\n" +
    "        Добавить фотографии\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("common/gallery/templates/image.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/gallery/templates/image.html",
    "<div>\n" +
    "\n" +
    "    <img ng-src=\"{$image.thumb$}\" class=\"img-responsive\" alt=\"Responsive image\">\n" +
    "\n" +
    "</div>");
}]);

angular.module("common/modal/templates/dialog.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/modal/templates/dialog.html",
    "<div ng-show=\"modalOptions.headerText\" class=\"modal-header\">\n" +
    "  <h3>{$ modalOptions.headerText $}</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "  <p>{$ modalOptions.bodyText $}</p>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "  <button type=\"button\" class=\"btn\"\n" +
    "          data-ng-click=\"modalOptions.close()\">{$ modalOptions.closeButtonText $}</button>\n" +
    "  <button class=\"btn btn-primary\"\n" +
    "          data-ng-click=\"modalOptions.ok();\">{$ modalOptions.actionButtonText $}</button>\n" +
    "</div>\n" +
    "");
}]);

angular.module("common/modal/templates/progress.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/modal/templates/progress.html",
    "<div class=\"modal-content\">\n" +
    "<div class=\"modal-header\">\n" +
    "    <button class=\"close\" type=\"button\"  ng-click=\"closeModal()\">&times;</button>\n" +
    "    <h4 class=\"modal-title\">{$ title $}</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <progressbar class=\"progress-striped active\" value=\"progressbar.progress\"></progressbar>\n" +
    "</div>\n" +
    "    </div>");
}]);

angular.module("common/print/print-table.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/print/print-table.html",
    "<tr ng-repeat=\"field in fields\" ng-show=\"entryForExport[field]\"><th>{$ entryForExport.meta.verbose_name[field] $}</th><td>{$ entryForExport[field] $}</td></tr>");
}]);

angular.module("common/toolbar/templates/toolbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/toolbar/templates/toolbar.html",
    "<li class=\"dropdown\" ng-cloak ng-show=\"Entries.model\">\n" +
    "    <a id=\"toolsDrop\" role=\"button\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "        &nbsp;&nbsp;Инструменты <b class=\"caret\"></b>\n" +
    "    </a>\n" +
    "    <ul class=\"dropdown-menu\">\n" +
    "        <li><a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\"\n" +
    "               ng-click=\"showFullExtent()\">\n" +
    "            <i class=\"fa fa-arrows-alt\"></i>&nbsp;&nbsp;Вся карта</a>\n" +
    "        </li>\n" +
    "        <li><a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\" ng-click=\"bboxSearchMode()\">\n" +
    "            <i class=\"fa fa-square-o\"></i>&nbsp;&nbsp;Выбрать прямоугольником</a>\n" +
    "        </li>\n" +
    "        <li ng-if=\"(Entries.queryEntryCount && Entries.baseEntryCount != Entries.queryEntryCount)||(is_filter)\">\n" +
    "            <a data-toggle=\"collapse\" data-target=\".navbar-collapse.in\" href=\"\" ng-click=\"cleanSelection()\">\n" +
    "                <i class=\"fa fa-ban\"></i>&nbsp;&nbsp;Сбросить выборку</a>\n" +
    "        </li>\n" +
    "        <li ng-if=\"(auth.user && auth.user===Entries.dynamit.user)\">\n" +
    "            <a href=\"\" ng-click=\"goToCreatePage()\" data-toggle=\"collapse\" data-target=\".navbar-collapse.in\">\n" +
    "                <i class=\"fa fa-plus-square\"></i>&nbsp;&nbsp;{$ NAMES.entry.create_short $}</a>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</li>");
}]);

angular.module("entries/detail/templates/detail.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/detail.html",
    "<div ng-if=\"!!entry\" class=\"panel panel-default\" id=\"feature\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6 col-lg-7':!emap.sidebar_is_narrow, 'col-xs-8 col-lg-10':emap.sidebar_is_narrow}\">\n" +
    "                        <span ng-show=\" NAMES.entry.short_name\">{$ NAMES.entry.short_name $}:</span>\n" +
    "                        <span ng-show=\"entry.entryid\" class=\"animate entryid-animate\">{$ entry.entryid | truncate $}</span>\n" +
    "                </div>\n" +
    "                <div ng-hide=\"emap.sidebar_is_narrow\" class=\"col-xs-3 col-lg-3\" ng-init=\"previous=null; next=null;\">\n" +
    "                    <span ng-show=\"previous\"><a href=\"\" ng-click=\"goToDetail(previous)\" title=\"Предыдущий платёжный терминал\">\n" +
    "                        <i class=\"fa fa-angle-double-left\"></i></a>\n" +
    "                    </span>\n" +
    "                    <span ng-show=\"brothers\" ><small>{$ num_in_cluster $}/{$ brothers.length $}</small></span>\n" +
    "                    <span ng-show=\"next\"><a href=\"\" ng-click=\"goToDetail(next)\" title=\"Следующий платёжный терминал\">\n" +
    "                        <i class=\"fa fa-angle-double-right\"></i></a>\n" +
    "                    </span>\n" +
    "                </div>\n" +
    "                <div  class=\"col-xs-2 col-lg-1\">\n" +
    "                    <div class=\"dropdown ico-dropdown\" ng-show=\"entry.user == auth.user || auth.is_superuser\" style=\"display:inline-block;\">\n" +
    "                      <a href=\"\" class=\"dropdown-toggle\">\n" +
    "                          <i class=\"fa fa-gears action-ico\" data-toggle=\"dropdown\"\n" +
    "                             onclick=\"$('.dropdown-toggle').dropdown();\"></i></a>\n" +
    "                      <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                          <li role=\"presentation\" ng-show=\"entry.geom\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"showOnTheMap(entry.id)\">\n" +
    "                                  <i class=\"fa fa-map-marker\"></i>&nbsp;&nbsp;Показать на карте</a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\" ng-hide=\"editmode || createmode\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"uploadEntry(entry.id)\">\n" +
    "                                  <i class=\"fa fa-upload\" ></i>&nbsp;&nbsp;Экспортировать</a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\">\n" +
    "                              <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"toggleEdit(entry.id)\">\n" +
    "                                  <i class=\"fa fa-pencil\"></i>&nbsp;&nbsp;\n" +
    "                                  <span ng-hide=\"editmode\">Редактировать</span>\n" +
    "                                  <span ng-show=\"editmode\">Отключить редактирование</span>\n" +
    "                              </a>\n" +
    "                          </li>\n" +
    "                          <li role=\"presentation\">\n" +
    "                            <a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteEntry(entry.id)\">\n" +
    "                             <i class=\"fa fa-trash-o\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                          </li>\n" +
    "                      </ul>\n" +
    "                    </div>\n" +
    "                    <div ng-hide=\"entry.user == auth.user || auth.is_superuser\" style=\"display:inline-block;\">\n" +
    "                        <a href=\"\" ng-click=\"showOnTheMap(entry.id)\"><i ng-show=\"entry.geom\" class=\"fa fa-map-marker action-ico\"\n" +
    "                                   data-toggle=\"tooltip\" data-placement=\"left\" title=\"Показать на карте\"></i></a>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-1 col-lg-1':!emap.sidebar_is_narrow, 'col-xs-2 col-lg-1':emap.sidebar_is_narrow}\">\n" +
    "                    <a href=\"\" ng-click=\"backToList()\" title=\"Закрыть панель\">\n" +
    "                    <i class=\"fa fa-chevron-left action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div  class=\"sidebar-body sidebar-body-detail\">\n" +
    "        <div ng-show=\"emap.sidebar_is_narrow && brothers\" class=\"panel-body row top-of-list\" ng-init=\"previous=null; next=null;\">\n" +
    "            <div  class=\"col-xs-4\"><button class=\"btn btn-default btn-xs\" ng-click=\"goToDetail(previous)\" ng-show=\"previous\" title=\"Предыдущий платёжный терминал\">\n" +
    "                <i class=\"fa fa-angle-double-left\"></i></button>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-4 text-center changer-center\">{$ num_in_cluster $}/{$ brothers.length $}</div>\n" +
    "            <div class=\"col-xs-4\"><button class=\"btn btn-default btn-xs pull-right\" ng-click=\"goToDetail(next)\" ng-show=\"next\" title=\"Следующий платёжный терминал\">\n" +
    "                <i class=\"fa fa-angle-double-right\"></i></button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\" id=\"feature-info\">\n" +
    "\n" +
    "            <div entry-attr data-entry=\"entry\" data-editmode=\"editmode\"></div>\n" +
    "\n" +
    "            <div ng-if=\"Entries.dynamit.photo_gallery\"\n" +
    "                 gallery-list data-entry=\"entry\"\n" +
    "                 data-canedit = \"auth.user === entry.user\"\n" +
    "                 data-enable=\"!editmode\"\n" +
    "                 data-dimensions=\"400x200\"></div>\n" +
    "\n" +
    "            <div ng-if=\"Entries.dynamit.can_comment\" comment-list data-entry=\"entry\" data-enable=\"!editmode\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div ng-cloak class=\"panel-footer\">\n" +
    "        <div class=\"input-group\" ng-hide=\"editmode || !Entries.dynamit.can_comment\">\n" +
    "            <input ng-hide=\"auth.user\" type=\"text\" class=\"form-control comment-input\" readonly placeholder=\"Войдите, чтобы оставить комментарий\">\n" +
    "            <input ng-model=\"comment\" ng-show=\"auth.user\" type=\"text\" class=\"form-control comment-input\" placeholder=\"Оставить комментарий...\">\n" +
    "                <span class=\"input-group-btn\">\n" +
    "                <button ng-click=\"createComment(comment, entry.id)\" class=\"btn btn-default\" type=\"button\">Отправить</button>\n" +
    "                </span>\n" +
    "        </div><!-- /input-group -->\n" +
    "\n" +
    "        <div ng-show=\"editmode || createmode\">\n" +
    "            <button ng-click=\"cancelEditing()\" class=\"btn btn-default pull-left\" type=\"button\">Отменить</button>\n" +
    "            <button ng-click=\"createOrUpdate()\" ng-disabled=\"entryForm.$invalid\" class=\"btn btn-primary pull-right\"  type=\"button\">\n" +
    "                <span ng-show=\"editmode && !createmode\">Обновить</span>\n" +
    "                <span ng-show=\"createmode\">Добавить</span>\n" +
    "            </button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div id=\"id_geom\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"!entry\">\n" +
    "    <div class=\"loading-details\">\n" +
    "        Загрузка...\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-auto-code.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-auto-code.html",
    "<a tabindex=\"-1\">\n" +
    "    <span bind-html-unsafe=\"match.label.code| typeaheadHighlight:query\"></span>\n" +
    "    <span><small><br>{$ match.label.full_name $}</small></span>\n" +
    "    <span><small>{$ match.label.rel_name $}</small></span>\n" +
    "</a>\n" +
    "");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-auto-regioncode.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-auto-regioncode.html",
    "<a tabindex=\"-1\" bind-html-unsafe=\"(match.label.regioncode+' '+match.label.full_name )| typeaheadHighlight:query\"></a>\n" +
    "\n" +
    "");
}]);

angular.module("entries/detail/templates/form-widget/addr-input-autocomplete.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form-widget/addr-input-autocomplete.html",
    "<a tabindex=\"-1\" class=\"autocomplete-list\">\n" +
    "    <span bind-html-unsafe=\"match.label.full_name| typeaheadHighlight:query\"></span>\n" +
    "    <span><small><br>{$ match.label.rel_name $}</small></span>\n" +
    "</a>");
}]);

angular.module("entries/detail/templates/form/fields/check-box-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/check-box-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input class=\"attr-input\" name=\"{$field$}\" ng-model=\"entry[field]\"\n" +
    "                   type=\"{$ type $}\"/>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/date-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/date-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <div class=\"input-group\">\n" +
    "                <input type=\"text\" class=\"form-control\" datepicker-popup=\"{$ format $}\" ng-model=\"entry[field]\"\n" +
    "                       is-open=\"opened\" datepicker-options=\"dateOptions\" server-error ng-change=\"formatDate()\"\n" +
    "                       ng-required=\"required\" close-text=\"Close\"/>\n" +
    "              <span class=\"input-group-btn\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" ng-click=\"open($event)\"><i\n" +
    "                        class=\"glyphicon glyphicon-calendar\"></i></button>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/geom.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/geom.html",
    "<button ng-hide=\"entry.geom\" ng-click=\"drawNewEntryMarker()\" id=\"entry-draw-btn\" class=\"btn btn-default btn-xs pull-left\" type=\"button\">\n" +
    "    <span ng-hide=\"drawNewMarkerMode\">Указать местоположение</span>\n" +
    "    <span ng-show=\"drawNewMarkerMode\">Отменить</span>\n" +
    "</button>\n" +
    "<div ng-show=\"entry.geom\">\n" +
    "    <div>\n" +
    "        <button ng-click=\"triggerEntryMarkerEdit()\" class=\"btn btn-default btn-xs pull-left\" type=\"button\">\n" +
    "            <span ng-hide=\"geomEditMode\">Изменить местоположение</span>\n" +
    "            <span ng-show=\"geomEditMode\">Закончить редакирование</span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form/fields/input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input class=\"form-control attr-input\" name=\"{$field$}\" ng-model=\"entry[field]\"\n" +
    "                   type=\"{$ type $}\" ng-required=\"\" server-error ng-maxlength=\"max_length\"/>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/detail/templates/form/fields/latlng.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/latlng.html",
    "<input name=\"coordinates\" type=\"text\" class=\"form-control attr-input\" placeholder=\"широта, долгота\"\n" +
    "       ng-model=\"entry.coordinates\" ng-change=\"getGeometryFromCoordInput(entry)\" ng-focus=\"cancelEntryMarkerEdit()\">");
}]);

angular.module("entries/detail/templates/form/fields/time-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/time-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-xs-6\">\n" +
    "                    Hours step is:\n" +
    "                    <select class=\"form-control\" ng-model=\"hstep\" ng-options=\"opt for opt in options.hstep\"></select>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-6\">\n" +
    "                    Minutes step is:\n" +
    "                    <select class=\"form-control\" ng-model=\"mstep\" ng-options=\"opt for opt in options.mstep\"></select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/detail/templates/form/fields/typeahead-input.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/fields/typeahead-input.html",
    "<div ng-class=\"{'has-error': entryFieldForm[field].$invalid }\">\n" +
    "    <div>\n" +
    "        <ng-form name=\"entryFieldForm\" class=\"entry-form\">\n" +
    "            <input ng-init=\"entryAddr[field] = entry[field]\"\n" +
    "                   class=\"form-control attr-input\"\n" +
    "                   type=\"text\" name=\"{$field$}\" ng-model=\"entryAddr[field]\" autocomplete=\"off\"\n" +
    "                   typeahead=\"address for address in addressAutocomplate($viewValue, field, panel)\"\n" +
    "                   typeahead-input-formatter=\"formatAddr($model, field)\"\n" +
    "                   typeahead-on-select=\"onAddressSelect($item, $model, $label, field, panel)\"\n" +
    "                   typeahead-template-url=\"{$ getTypeheadTemplate(field) $}\"\n" +
    "                   typeahead-min-length=\"{$ getTypeheadMinLength(field) $}\"\n" +
    "                   typeahead-wait-ms=\"600\">\n" +
    "        </ng-form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("entries/detail/templates/form/form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/detail/templates/form/form.html",
    "<div class=\"panel-group\" id=\"accordion\" role=\"tablist\" aria-multiselectable=\"true\">\n" +
    "    <form name=\"entryForm\" id=\"entryform\">\n" +
    "        <div class=\"panel panel-default\" ng-repeat=\"panel in panels\">\n" +
    "            <div class=\"panel-heading\" role=\"tab\" id=\"{$panel.id$}\" ng-init=\"panel.collapsed = is_collapsed(panel)\">\n" +
    "                <h4 class=\"panel-title\">\n" +
    "                    <a data-toggle=\"collapse\" data-parent=\"#accordion\" ng-click=\"collapseToggle(panel)\">\n" +
    "                        <span>{$panel.title$}</span>\n" +
    "                    <span><i class=\"fa pull-right\"\n" +
    "                             ng-class=\"{'fa-chevron-down':panel.collapsed, 'fa-chevron-up':!panel.collapsed}\"></i>\n" +
    "                    </span>\n" +
    "                    </a>\n" +
    "                </h4>\n" +
    "            </div>\n" +
    "            <div id=\"collapse{$panel.id$}\" class=\"panel-collapse collapse\" ng-class=\"{'in': !panel.collapsed}\"\n" +
    "                 role=\"tabpanel\" aria-labelledby=\"headingOne\">\n" +
    "                <div>\n" +
    "                    <table class='table table-condensed'>\n" +
    "                        <tr ng-repeat=\"field in panel.fields\" ng-form=\"entryFieldForm-{$ field $}\"\n" +
    "                            ng-show=\"((entryMeta[field] || panel['custom_edit_template'][field]) && (createmode || editmode)) ||\n" +
    "                            (entry[field] && !editmode && !(panel.edit_only && panel.edit_only.indexOf(field)>-1))\">\n" +
    "                            <th class=\"attr-row-title\">{$ entryMeta[field]['label'] $}</th>\n" +
    "                            <td ng-if=\"!editmode\">{$ entry[field] $}</td>\n" +
    "                            <td ng-if=\"editmode\">\n" +
    "                                <div input-control></div>\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                    </table>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </form>\n" +
    "</div>");
}]);

angular.module("entries/list/templates/entries-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entries-list.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-if=\"(auth.user && auth.user===Entries.dynamit.user)\">\n" +
    "                <td class=\"create-entry-cell\" ng-click=\"goToCreatePage()\" title=\"{$ NAMES.entry.create $}\">\n" +
    "                    <span><i class=\"glyphicon glyphicon-plus create-ico\" ></i></span>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "            <tr ng-repeat=\"e in entries\" class=\"animate\" ng-class=\"{'animate-item':!appConf.previousEntry}\" id=\"entry-{$e.id$}\">\n" +
    "                <td entry-in-list data-entry=\"e\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    <div ng-if=\"nextPage\" ng-click=\"showMore()\" class=\"box-content\">\n" +
    "        <button class=\"btn btn-default center-block show-more-btn\" data-loading-text=\"Загрузка...\">\n" +
    "            Загрузить ещё\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/list/templates/entries-table.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entries-table.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-repeat=\"e in entries\" class=\"animate\" ng-class=\"{'animate-item':!appConf.previousEntry}\" id=\"entry-{$e.id$}\">\n" +
    "                <td entry-in-list data-entry=\"e\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    <div ng-if=\"nextPage\" ng-click=\"showMore()\" class=\"box-content\">\n" +
    "        <button class=\"btn btn-default center-block show-more-btn\" data-loading-text=\"Загрузка...\">\n" +
    "            Загрузить ещё\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/list/templates/entry-in-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/list/templates/entry-in-list.html",
    "<td class=\"feature-name\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <a class=\"inherit-color\" href=\"\" ng-click=\"goToDetail(e.id)\">{$ ::e.entryListName $}</a>\n" +
    "        </div>\n" +
    "        <div  class=\"col-xs-3 ico-in-list ico-part\">\n" +
    "            <div class=\"ico-dropdown list-ico dropdown\" ng-show=\"e.user == auth.user || auth.is_superuser\">\n" +
    "               <div class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                  <i class=\"fa fa-gears action-ico\"\n" +
    "                     onclick=\"angular.element('.dropdown-toggle').dropdown();\"></i></div>\n" +
    "              <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"goToDetail(e.id)\">\n" +
    "                          <i class=\"fa fa-info-circle action-ico\"></i>&nbsp;&nbsp;Информация</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"startEdit(e.id)\">\n" +
    "                          <i class=\"fa fa-pencil action-ico\" ></i>&nbsp;&nbsp;Редактировать</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                    <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteEntry(e.id, e.entryid)\">\n" +
    "                     <i class=\"fa fa-trash-o action-ico\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                  </li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "            <div ng-hide=\"e.user == auth.user || auth.is_superuser\" class=\"list-ico\">\n" +
    "                <i class=\"fa fa-info-circle action-ico\" title=\"Информация\" ng-click=\"goToDetail(e.id)\"></i>\n" +
    "            </div>\n" +
    "            <div class=\"list-ico\">\n" +
    "               <i ng-show=\"e.geom\" ng-click=\"showOnTheMap(e.id)\"\n" +
    "                  class=\"fa fa-map-marker action-ico\" data-placement=\"left\" title=\"Показать на карте\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</td>");
}]);

angular.module("entries/manager/editor/base-form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/base-form.html",
    "<form name=\"baseForm\">\n" +
    "    <fieldset>\n" +
    "        <div class=\"row\">\n" +
    "            <!-- Name -->\n" +
    "            <div class=\"form-group col-xs-6\" ng-class=\"{'has-error': dynamitForm.baseForm.name.$invalid }\">\n" +
    "                <label class=\"control-label\" for=\"name\">{$ meta.actions['name'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <input id=\"name\" name=\"name\" ng-model=\"dynamit.name\" type=\"text\" placeholder=\"\"\n" +
    "                           class=\"form-control\" required=\"\" server-error\n" +
    "                           ng-maxlength=\"meta.actions['name'].max_length\" ng-change=\"slugify(dynamit)\">\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['name'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['name'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <!-- Slug -->\n" +
    "            <div class=\"form-group col-xs-6\" ng-class=\"{'has-error': dynamitForm.baseForm.slug.$invalid }\">\n" +
    "                <label class=\"control-label\" for=\"slug\">{$ meta.actions['slug'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <input id=\"slug\" name=\"slug\" ng-model=\"dynamit.slug\" type=\"text\" placeholder=\"\"\n" +
    "                           class=\"form-control\" required=\"\" server-error ng-change=\"selfslugify(dynamit)\"\n" +
    "                           ng-maxlength=\"meta.actions['slug'].max_length\">\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['slug'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['slug'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <!-- Descriptions -->\n" +
    "        <div class=\"form-group\">\n" +
    "            <label class=\"control-label\" for=\"description\">{$ meta.actions['description'].label $}</label>\n" +
    "\n" +
    "            <div class=\"controls\">\n" +
    "                <textarea id=\"description\" ng-model=\"dynamit.description\" name=\"description\"\n" +
    "                          class=\"form-control\" rows=\"2\"></textarea>\n" +
    "\n" +
    "                <p ng-if=\"meta.actions['description'].help_text\"\n" +
    "                   class=\"help-block\">{$ meta.actions['description'].help_text $}</p>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </fieldset>\n" +
    "</form>");
}]);

angular.module("entries/manager/editor/dynamit-field.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-field.html",
    "<tr class=\"tr-block\">\n" +
    "    <td class=\"drag-block\" ng-show=\"candrag\"><i class=\"fa fa-sort\"></i></td>\n" +
    "    <td>\n" +
    "        <input name=\"verbose_name\" ng-model=\"f.verbose_name\" type=\"text\" placeholder=\"\"\n" +
    "               class=\"form-control input-block-level\" required=\"\" server-error ng-change=\"slugify(f)\"\n" +
    "               ng-maxlength=\"meta['verbose_name'].max_length\">\n" +
    "    </td>\n" +
    "    <td>\n" +
    "        <input name=\"name\" ng-model=\"f.name\" type=\"text\" placeholder=\"\"\n" +
    "               class=\"form-control input-block-level\" required=\"\" ng-change=\"selfslugify(f)\"\n" +
    "               ng-maxlength=\"meta['name'].max_length\">\n" +
    "    </td>\n" +
    "    <td>\n" +
    "        <select name=\"field_type\" ng-model=\"f.field_type\" class=\"form-control input-block-level\" required>\n" +
    "            <option ng-repeat=\"c in meta['field_type']['choices']\" value=\"{$c.value$}\"\n" +
    "                    ng-selected=\"f.field_type === c.value\">{$c.display_name$}</option>\n" +
    "        </select>\n" +
    "    </td>\n" +
    "\n" +
    "    <td class=\"trash-block\"><a href=\"\" ng-click=\"removeField(f)\">\n" +
    "        <i class=\"fa fa-trash-o \"></i></a></td>\n" +
    "</tr>\n" +
    "");
}]);

angular.module("entries/manager/editor/dynamit-fields.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-fields.html",
    "<div ng-if=\"meta.actions['fields']\">\n" +
    "    <div ng-show='false' ng-click=\"candrag = !candrag\">\n" +
    "        <span ng-show=\"candrag\"><i class=\"fa fa-toggle-on\"></i>&nbsp;Выключить сортировку полей</span>\n" +
    "        <span ng-hide=\"candrag\"><i class=\"fa fa-toggle-off\"></i>&nbsp;Включить сортировку полей</span>\n" +
    "    </div>\n" +
    "    <form name=\"fieldsForm\" ng-if=\"dynamit.fields.length\">\n" +
    "        <table class=\"input-block-level\">\n" +
    "            <thead>\n" +
    "                <tr>\n" +
    "                    <th ng-show=\"candrag\"></th>\n" +
    "                    <th>{$ meta.actions['fields']['verbose_name'].label $}</th>\n" +
    "                    <th>{$ meta.actions['fields']['name'].label $}</th>\n" +
    "                    <th>{$ meta.actions['fields']['field_type'].label $}</th>\n" +
    "                </tr>\n" +
    "            </thead>\n" +
    "            <tbody ui-sortable=\"sortableOptions\" ng-model=\"dynamit.fields\" class=\"list\">\n" +
    "                <tr ng-repeat=\"field in dynamit.fields\"\n" +
    "                    dynamit-field\n" +
    "                    data-field=\"field\"\n" +
    "                    data-candrag=\"candrag\"\n" +
    "                    data-meta=\"meta.actions['fields']\"\n" +
    "                    data-action=\"removeDynamitField(field)\"></tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </form>\n" +
    "    <div class=\"add-field-block\" ng-click=\"addEmptyField()\">\n" +
    "        Добавить поле\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("entries/manager/editor/dynamit-options.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/dynamit-options.html",
    "<form name=\"optionsForm\">\n" +
    "    <fieldset>\n" +
    "\n" +
    "        <!-- Options -->\n" +
    "        <div class=\"form-group multi-cbx\">\n" +
    "            <label class=\"control-label\" for=\"options\">Опции</label>\n" +
    "\n" +
    "            <div class=\"form-group\">\n" +
    "                <label class=\"checkbox-inline\" for=\"can_comment\">\n" +
    "                    <input type=\"checkbox\" name=\"can_comment\" id=\"can_comment\"\n" +
    "                           ng-model=\"dynamit.can_comment\" value=\"{$ meta.actions['can_comment'].label $}\">\n" +
    "                    {$ meta.actions['can_comment'].label $}\n" +
    "                </label>\n" +
    "                <label class=\"checkbox-inline\" for=\"photo_gallery\">\n" +
    "                    <input type=\"checkbox\" name=\"photo_gallery\" id=\"photo_gallery\"\n" +
    "                           ng-model=\"dynamit.photo_gallery\" value=\"{$ meta.actions['photo_gallery'].label $}\">\n" +
    "                    {$ meta.actions['photo_gallery'].label $}\n" +
    "                </label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <!-- Entry name select -->\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"form-group col-lg-5\">\n" +
    "                <label class=\"control-label\" for=\"description\">{$ meta.actions['entryname'].label $}</label>\n" +
    "\n" +
    "                <div class=\"controls\">\n" +
    "                    <select name=\"entryname\" ng-model=\"dynamit.entryname\"\n" +
    "                            class=\"form-control input-block-level input-sm\">\n" +
    "                        <option value=\"id\" ng-selected=\"dynamit.entryname === 'id'\">ID</option>\n" +
    "                        <option ng-repeat=\"f in dynamit.fields\" ng-show=\"f.name && f.verbose_name\"\n" +
    "\n" +
    "                                value=\"{$f.name$}\" ng-selected=\"f.name === dynamit.entryname\">{$ f.verbose_name $}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "\n" +
    "                    <p ng-if=\"meta.actions['entryname'].help_text\"\n" +
    "                       class=\"help-block\">{$ meta.actions['entryname'].help_text $}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </fieldset>\n" +
    "</form>");
}]);

angular.module("entries/manager/editor/editor-modal.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/editor/editor-modal.html",
    "<div id=\"dynamit-editor\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"cancel()\">&times;</button>\n" +
    "        <h4 class=\"modal-title\">\n" +
    "            <span ng-hide=\"oldDynamit\">Добавление нового слоя</span>\n" +
    "            <span ng-show=\"oldDynamit\">Редактироване слоя \"{$oldDynamit.name$}\"</span>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <form name=\"dynamitForm\" id=\"dynamit-form\">\n" +
    "            <tabset>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Основные параметры&nbsp;<i ng-if=\"dynamitForm.baseForm.$invalid\"\n" +
    "                                                   class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-base-form></div>\n" +
    "                </tab>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Колонки&nbsp;<i ng-if=\"dynamitForm.fieldsForm.$invalid\" class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-fields></div>\n" +
    "                </tab>\n" +
    "                <tab>\n" +
    "                    <tab-heading>\n" +
    "                        Настройка записей&nbsp;<i ng-if=\"dynamitForm.optionsForm.$invalid\" class=\"fa fa-exclamation-triangle\"></i>\n" +
    "                    </tab-heading>\n" +
    "                    <div dynamit-options=\"\"></div>\n" +
    "                </tab>\n" +
    "            </tabset>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <div class=\"pull-left\">\n" +
    "            <div ng-click=\"dynamit.is_public = !dynamit.is_public\">\n" +
    "                <i class=\"fa fa-eye fa-2x is-public\" ng-show=\"dynamit.is_public\" title=\"Публичный слой\"></i>\n" +
    "                <i class=\"fa fa-eye-slash fa-2x is-public\" ng-hide=\"dynamit.is_public\" title=\"Закрытый слой\"></i>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Отмена</button>\n" +
    "\n" +
    "        <button ng-hide=\"oldDynamit\" type=\"submit\" ng-click=\"create()\" ng-disabled=\"dynamitForm.$invalid\"\n" +
    "                class=\"btn btn-primary\">\n" +
    "            Создать слой\n" +
    "        </button>\n" +
    "        <button ng-show=\"oldDynamit\" type=\"submit\" ng-click=\"update()\" ng-disabled=\"dynamitForm.$invalid\"\n" +
    "                class=\"btn btn-primary\">\n" +
    "            Обновить слой\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("entries/manager/templates/dynamit-in-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/dynamit-in-list.html",
    "<td class=\"feature-name\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <a class=\"inherit-color\" href=\"\" ng-click=\"goToEntry(d)\">{$ d.name $}</a><br>\n" +
    "            <div ng-show=\"d.description\"><small>{$ d.description | limitTo: 120 $}</small></div>\n" +
    "            <span><small>{$ ::d.user $}</small></span>\n" +
    "            <span ng-show=\"d.photo_gallery\">&nbsp;<i class=\"fa fa-picture-o\"></i></span>\n" +
    "            <span ng-show=\"d.can_comment\">&nbsp;<i class=\"fa fa-comment-o\"></i></span>\n" +
    "            <span ng-show=\"d.is_public\">&nbsp;<i class=\"fa fa-eye\"></i></span>\n" +
    "            <span ng-hide=\"d.is_public\">&nbsp;<i class=\"fa fa-eye-slash\"></i></span>\n" +
    "        </div>\n" +
    "        <div  class=\"col-xs-3\">\n" +
    "            <div class=\"ico-dropdown ico-in-list ico-part list-ico dropdown\" ng-show=\"d.user == auth.user || auth.is_superuser\">\n" +
    "               <div class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n" +
    "                  <i class=\"fa fa-gears action-ico\"\n" +
    "                     onclick=\"angular.element('.dropdown-toggle').dropdown();\"></i></div>\n" +
    "              <ul class=\"dropdown-menu pull-right\" role=\"menu\">\n" +
    "                  <li role=\"presentation\">\n" +
    "                      <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"startEdit(d)\">\n" +
    "                          <i class=\"fa fa-pencil action-ico\" ></i>&nbsp;&nbsp;Редактировать</a>\n" +
    "                  </li>\n" +
    "                  <li role=\"presentation\">\n" +
    "                    <a class=\"inherit-color\" role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"deleteDynamit(d)\">\n" +
    "                     <i class=\"fa fa-trash-o action-ico\"></i>&nbsp;&nbsp;Удалить</a>\n" +
    "                  </li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</td>");
}]);

angular.module("entries/manager/templates/dynamit-list.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/dynamit-list.html",
    "<div class=\"feature-list\">\n" +
    "    <table class=\"table table-hover\">\n" +
    "        <tbody>\n" +
    "            <tr ng-if=\"!!auth.user\">\n" +
    "                <td class=\"create-entry-cell\" title=\"Создать слой\"\n" +
    "                    ng-click=\"goToCreatePage()\"\n" +
    "                    ng-file-drop\n" +
    "                    ng-file-change=\"upload($files)\"\n" +
    "                    drag-over-class=\"dragover\"\n" +
    "                    accept=\".geojson,.kml,.gpx\">\n" +
    "                    <span><i class=\"glyphicon glyphicon-plus create-ico\"></i></span>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "            <tr ng-repeat=\"d in Dynamit.dynamits\" class=\"animate\" id=\"entry-{$d.id$}\">\n" +
    "                <td dynamit-in-list data-entry=\"d\"></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("entries/manager/templates/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/manager/templates/sidebar.html",
    "<div class=\"panel panel-default\" id=\"features\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6': !is_narrow, 'col-xs-7': is_narrow}\">\n" +
    "                    <span>Список слоёв</span>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-4': !is_narrow, 'col-xs-3': is_narrow}\" ng-cloak>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-2\"><a href=\"\" ng-click=\"hideSidebar()\"><i class=\"fa fa-times action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div class=\"sidebar-body\">\n" +
    "            <div dynamit-list></div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("entries/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("entries/sidebar.html",
    "<div class=\"panel panel-default\" id=\"features\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "        <h3 class=\"panel-title\">\n" +
    "            <div class=\"row\">\n" +
    "                <div ng-class=\"{'col-xs-6': !is_narrow, 'col-xs-7': is_narrow}\">\n" +
    "                    <span>Список</span>\n" +
    "                </div>\n" +
    "                <div ng-class=\"{'col-xs-4': !is_narrow, 'col-xs-3': is_narrow}\" ng-cloak>\n" +
    "                    <div ng-if=\"entries && Entries.baseEntryCount != Entries.queryEntryCount\">\n" +
    "                      <small><span ng-hide=\"is_narrow\">Выбрано:</span>{$ Entries.queryEntryCount $}\n" +
    "                      <i class=\"fa fa-ban action-ico\" ng-click=\"cleanSelection()\" title=\"Сбросить выборку\"></i></small>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-2\"><a href=\"\" ng-click=\"hideSidebar()\"><i class=\"fa fa-times action-ico pull-right\"></i></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </h3>\n" +
    "    </div>\n" +
    "    <div class=\"sidebar-body\" endless-scroll=\"showMore()\">\n" +
    "\n" +
    "            <div entries-list></div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);
