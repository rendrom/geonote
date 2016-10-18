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