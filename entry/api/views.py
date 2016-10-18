# coding=utf-8
from __future__ import unicode_literals

import slugify
from django.apps import apps
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.utils import timezone
from rest_framework import viewsets, generics
from rest_framework.fields import SerializerMethodField
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer, DateTimeField
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter
from rest_framework_gis.serializers import GeoFeatureModelSerializer, GeoModelSerializer

from comments.models import Comment
from dynamit.models import DynamitModel
from entry.api import serializers, permissions, authenticators
from entry.api.filters import InRegionFilter
from entry.api.metadata import EntryMetadata
from entry.api.permissions import IsPublicOrDynamitUser, IsAuthenticatedOrPublic
from uploader.models import Images


class UserView(viewsets.ModelViewSet):
    serializer_class = serializers.UserSerializer
    model = User

    def get_permissions(self):
        # allow non-authenticated user to create
        return (AllowAny() if self.request.method == 'POST'
                else permissions.IsStaffOrTargetUser()),


class AuthView(APIView):
    authentication_classes = (authenticators.QuietBasicAuthentication,)

    def post(self, request, *args, **kwargs):
        login(request, request.user)
        return Response(serializers.UserSerializer(request.user).data)

    def delete(self, request, *args, **kwargs):
        logout(request)
        return Response()


class EntryListPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    ordering = '-change_date',
    max_page_size = 1000


class DynamitAPI:
    """
    Генерируем необходимые класы для REST-api
    """

    def __init__(self, *args, **kwargs):
        model = kwargs.get('model', '')
        username = kwargs.get('username', '')
        if not model:
            raise TypeError("Model name not set")
        else:
            model_name = '{}_{}'.format(username, model)
            app = cache.get(model_name)
            if app is None:
                user = User.objects.get(username=username)
                app = DynamitModel.objects.get(slug=model, user=user)
                cache.set(model_name, app, 60)

            self.dynamo_app = app
            app_models = apps.all_models[app.app]
            if str(app.slug) in app_models:
                model = app_models[str(app.slug.lower())]
            else:
                model = app.as_model()
            self.dynamo_model = model

    def get_model_content_type(self):
        ct = cache.get('{}_ct'.format(self.dynamo_app.slug))
        if ct is None:
            ct = ContentType.objects.get_for_model(self.dynamo_model)
            cache.set(self.dynamo_app.slug, ct, 60)
        return ct

    def as_entry_list(self):
        dynamo_model = self.dynamo_model
        attrs = {'model': dynamo_model, 'queryset': dynamo_model.objects.all().order_by('-change_date'),
                 'serializer_class': self.as_entry_list_serializer(),
                 'pagination_class': EntryListPagination,
                 'page_size': 100,
                 'bbox_filter_field': 'geom',
                 'filter_backends': (InBBoxFilter, InRegionFilter),
                 'permission_classes': (IsPublicOrDynamitUser,), }
        viewset = type(str('%sEntryList' % self.dynamo_app.slug), (generics.ListAPIView,), attrs)
        return viewset

    def as_entry_geolist(self):
        dynamo_model = self.dynamo_model
        attrs = {
            'queryset': dynamo_model.objects.all(),
            'serializer_class': self.as_entry_geolist_serializer(),
            'bbox_filter_field': 'geom',
            'filter_backends': (InBBoxFilter, InRegionFilter),
            'permission_classes': (IsPublicOrDynamitUser,)
        }
        viewset = type(str('%sEntryGeoList' % self.dynamo_app.slug), (generics.ListAPIView,), attrs)
        return viewset

    def as_entry_large_view(self):
        attrs = {
            'queryset': self.dynamo_model.objects.all(),
            'serializer_class': self.as_entry_large_view_serializer(),
            'metadata_class': EntryMetadata,
        }

        def perform_create(self, serializer):
            if isinstance(self.request.user, User):
                serializer.save(user=self.request.user)

        def get_permissions(self):
            if self.request.method in ['GET', 'OPTIONS']:
                return IsPublicOrDynamitUser(),
            elif self.request.method == 'POST':
                return permissions.IsStaffOrDynamitOwner(),
            else:
                return permissions.IsStaffOrTargetUser(),

        def destroy(self, request, *args, **kwargs):
            model_slug = kwargs.get('model', '')
            model_pk = kwargs.get('pk', '')
            if model_slug and model_pk:
                model = DynamitModel.objects.get(slug=model_slug)
                c_type = ContentType.objects.get_for_model(model.as_model())
                Comment.objects.filter(content_type=c_type, object_pk=model_pk).delete()
                Images.objects.filter(content_type=c_type, object_pk=model_pk).delete()

            return super(self.__class__, self).destroy(request, *args, **kwargs)

        attrs['destroy'] = destroy
        attrs['get_permissions'] = get_permissions
        attrs['perform_create'] = perform_create
        viewset = type(str('%sEntryLargeVies' % self.dynamo_app.slug), (viewsets.ModelViewSet,), attrs)
        return viewset

    def as_entry_comment_list(self):
        attrs = {
            'queryset': Comment.objects.filter(content_type=self.get_model_content_type()),
            'serializer_class': self.as_entry_comment_view_serializer(),
            'permission_classes': (IsPublicOrDynamitUser,)
        }

        def get_queryset(self):
            queryset = super(self.__class__, self).get_queryset()
            return queryset.filter(object_pk=self.kwargs.get('pk')).order_by('-submit_date')

        attrs['get_queryset'] = get_queryset
        viewset = type(str('%sEntryCommentsVies' % self.dynamo_app.slug), (generics.ListAPIView,), attrs)
        return viewset

    def as_entry_image_list(self):
        attrs = {
            'queryset': Images.objects.for_model(self.dynamo_model),
            'serializer_class': self.as_entry_image_view_serializer(),
            'permission_classes': (IsPublicOrDynamitUser,)
        }

        def get_queryset(self):
            queryset = super(self.__class__, self).get_queryset()
            return queryset.filter(object_pk=self.kwargs.get('pk')).order_by('-create_date')

        attrs['get_queryset'] = get_queryset
        viewset = type(str('%sEntryImageVies' % self.dynamo_app.slug), (generics.ListAPIView,), attrs)
        return viewset

    def as_comment_view(self):
        attrs = {
            'queryset': Comment.objects.filter(is_public=True),
            'serializer_class': self.as_entry_comment_view_serializer(),
            'permission_classes': (permissions.IsOwner,),
        }
        entry = self.dynamo_model

        def perform_create(self, serializer):
            entry_id = self.request.data['object_pk']
            e = entry.objects.get(pk=entry_id)
            entry_type = ContentType.objects.get_for_model(e)

            if isinstance(self.request.user, User):
                instance = serializer.save(user=self.request.user, submit_date=timezone.now(),
                                           site_id=settings.SITE_ID, object_pk=entry_id, content_type=entry_type)

        def get_permissions(self):
            return (IsAuthenticatedOrPublic() if self.request.method == 'POST'
                    else permissions.IsStaffOrTargetUser()),

        attrs['get_permissions'] = get_permissions
        attrs['perform_create'] = perform_create
        viewset = type(str('%sCommentVies' % self.dynamo_app.slug), (viewsets.ModelViewSet,), attrs)
        return viewset

    def as_image_view(self):
        attrs = {
            'parser_classes': (FormParser, MultiPartParser),
            'permission_classes': (IsPublicOrDynamitUser,)
        }
        entry = self.dynamo_model
        image_serializer = self.as_entry_image_view_serializer()

        def post(self, request, format=None, entryid=None, dynamit=None):
            file_obj = request.data['file']
            if file_obj:
                entry_id = entryid
                e = entry.objects.get(pk=entry_id)
                entry_type = ContentType.objects.get_for_model(e)
                file_name = unicode(file_obj.name)
                file_name_parts = file_name.split(".")
                file_type = ""
                if len(file_name_parts) > 1:
                    file_type = file_name_parts[-1]
                    file_name = file_name_parts[:-1]
                file_name = slugify.slugify(file_name, only_ascii=True)
                file_obj.name = "%s.%s" % (file_name, file_type)
                if isinstance(self.request.user, User):
                    im = Images(user=self.request.user, create_date=timezone.now(), image=file_obj,
                                object_pk=entry_id, content_type=entry_type)
                    im.name = file_name
                    im.save()
                    im.request = request
                    response = image_serializer(im)

                    return Response(status=200, data=response.data)
            return Response(status=202)

        def delete(self, request, format=None, entryid=None, dynamit=None):
            image = Images.objects.get(pk=int(entryid))
            image.delete()
            return Response(status=204)

        def get_permissions(self):
            return (permissions.IsStaffOrDynamitOwner() if self.request.method == 'POST'
                    else permissions.IsStaffOrTargetUser()),

        attrs['get_permissions'] = get_permissions
        attrs['post'] = post
        attrs['delete'] = delete
        viewset = type(str('%sImagesVies' % self.dynamo_app.slug), (APIView,), attrs)
        return viewset

    def as_entry_list_serializer(self):
        attrs = {
            'entryid': SerializerMethodField(label='ID'),
        }
        dynamo_model = self.dynamo_model

        class Meta:
            model = dynamo_model
            fields = ('id', 'entryid', 'geom', 'user')
            read_only_fields = ('user',)

        attrs['Meta'] = Meta
        attrs['to_representation'] = username_representation
        attrs['get_entryid'] = get_entryid
        serializer = type(str('%sEntrySerializer' % self.dynamo_app.slug), (ModelSerializer,), attrs)
        return serializer

    def as_entry_geolist_serializer(self):
        attrs = {
            'entryid': SerializerMethodField(label='ID'),
        }

        class Meta:
            model = self.dynamo_model
            queryset = self.dynamo_model.objects.exclude(geom=None)
            geo_field = 'geom'
            fields = ('id', 'entryid')

        attrs['Meta'] = Meta
        attrs['get_entryid'] = get_entryid
        serializer = type(str('%sEntryGeoSerializer' % self.dynamo_app.slug), (GeoFeatureModelSerializer,), attrs)
        return serializer

    def as_entry_large_view_serializer(self):
        attrs = {
            'entryid': SerializerMethodField(label='ID'),
            'latlng': SerializerMethodField(label='Координаты')
        }

        def get_latlng(self, obj):
            if obj.geom:
                if obj.geom.geom_type == 'Point':
                    return "Широта: %.3f с.ш. Долгота: %.3f в.д." % (obj.geom.x, obj.geom.y)
            return False

        class Meta:
            model = self.dynamo_model
            read_only_fields = ('user', 'create_date', 'change_date', 'entryid')

        attrs['Meta'] = Meta
        attrs['get_entryid'] = get_entryid
        attrs['get_latlng'] = get_latlng
        attrs['to_representation'] = username_representation
        serializer = type(str('%sEntryLargeSerializer' % self.dynamo_app.slug), (GeoModelSerializer,), attrs)
        return serializer

    def as_entry_comment_view_serializer(self):
        attrs = {
            'submit_date': DateTimeField(required=False, default=timezone.now())
        }

        class Meta:
            model = Comment
            fields = ('id', 'comment', 'user', 'submit_date')
            read_only_fields = ('user',)

        attrs['Meta'] = Meta
        attrs['to_representation'] = username_representation
        serializer = type(str('%sEntryCommentSerializer' % self.dynamo_app.slug), (ModelSerializer,), attrs)
        return serializer

    def as_entry_image_view_serializer(self):
        attrs = {
            'thumb': serializers.HyperlinkedThumbField()
        }

        class Meta:
            model = Images
            fields = ('id', 'image', 'thumb', 'user', 'create_date')
            read_only_fields = ('user', 'thumb')

        attrs['Meta'] = Meta
        attrs['to_representation'] = username_representation
        serializer = type(str('%sEntryImageSerializer' % self.dynamo_app.slug), (ModelSerializer,), attrs)
        return serializer


def username_representation(self, instance):
    ret = super(self.__class__, self).to_representation(instance)
    user = instance.user
    ret['user'] = user.username
    return ret


def get_entryid(self, obj):
    try:
        entryname = self._kwargs['context']['view'].kwargs['dynamit'].entryname
        return getattr(obj, entryname)
    except Exception as e:
        print obj.id
