# coding=utf-8
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static

from django.contrib import admin
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from dynamit.api.views import DynamitModelViewSet
from entry.views import IndexPage
from rest_framework import routers
from entry.api.views import UserView, DynamitAPI
from uploader.api.views import DynamitUploadView

admin.autodiscover()

router = routers.DefaultRouter()
router.register(r'users', UserView, 'list')
router.register(r'dynamit', DynamitModelViewSet)
# router.register(r'dynamitmodelfields', DynamitModelFieldViewSet)


def entry_list(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_list = api.as_entry_list().as_view()
    return entry_list(request, *args, **kwargs)

def entry_geolist(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_geolist = api.as_entry_geolist().as_view()
    return entry_geolist(request, *args, **kwargs)

def entry_commentlist(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_commentlist = api.as_entry_comment_list().as_view()
    return entry_commentlist(request, *args, **kwargs)

def entry_imagelist(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_imagelist = api.as_entry_image_list().as_view()
    return entry_imagelist(request, *args, **kwargs)

def entry_large_list(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_large_list = api.as_entry_large_view().as_view({
        'get': 'list',
        'post': 'create'
    })
    return entry_large_list(request, *args, **kwargs)

def entry_large_detail(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    entry_large_detail = api.as_entry_large_view().as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })
    return entry_large_detail(request, *args, **kwargs)

def comment_list(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    comment_list = api.as_comment_view().as_view({
        'get': 'list',
        'post': 'create'
    })
    return comment_list(request, *args, **kwargs)

def comment_detail(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    comment_detail = api.as_comment_view().as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })
    return comment_detail(request, *args, **kwargs)

def image_list(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)
    kwargs['dynamit'] = api.dynamo_app
    image_list = api.as_image_view().as_view()
    return image_list(request, *args, **kwargs)

def image_detail(request, *args, **kwargs):
    api = DynamitAPI(*args, **kwargs)

    image_detail = api.as_image_view().as_view()
    return image_detail(request, entryid=kwargs.get('pk'), dynamit=api.dynamo_app)


entry_urls = [
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/$', csrf_exempt(entry_list), name='entry-list'),
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/(?P<pk>\d+)/comments/$', csrf_exempt(entry_commentlist), name='entrycommetns-list'),
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/(?P<pk>\d+)/images/$', csrf_exempt(entry_imagelist), name='entryimage-list'),
]

entry_large_urls = [
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/$', csrf_exempt(entry_large_list), name='entry_large-list'),
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/(?P<pk>[0-9]+)/$', csrf_exempt(entry_large_detail), name='entry_large-detail'),
]

comments_urls = [
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/$', csrf_exempt(comment_list), name='comment-list'),
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/(?P<pk>[0-9]+)/$', csrf_exempt(comment_detail), name='comment-detail'),
]

images_urls = [
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/$', csrf_exempt(image_list), name='comment-list'),
    url(r'^(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/(?P<pk>[0-9]+)/$', csrf_exempt(image_detail), name='comment-detail'),
]


urlpatterns = [
    url(r'^$', IndexPage.as_view(), name='home'),
    url(r'^entry/', include('entry.urls')),
    url(r'^api/', include(router.urls)),
    url(r'^api/entry_large/', include(entry_large_urls)),
    url(r'^api/comments/', include(comments_urls)),
    url(r'^api/images/', include(images_urls)),
    url(r'^api/entry/', include(entry_urls)),
    url(r'^api/geomodel/(?P<username>\w+)/(?P<model>[a-z0-9-_]+)/$', entry_geolist, name='entry-geolist'),
    # url(r'^api/auth/$', AuthView.as_view(), name='authenticate'),
    url(r'^dynamit_upload/$', DynamitUploadView.as_view(), name='upload-dynamit'),

    url(r'^auth/', include('djoser.urls.authtoken')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^robots\.txt$', lambda r: HttpResponse("User-agent: *\nDisallow: /", mimetype="text/plain")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
