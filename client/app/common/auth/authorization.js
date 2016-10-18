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
