# coding=utf-8
from __future__ import unicode_literals
from django.contrib.auth.models import User
from easy_thumbnails.files import get_thumbnailer
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'first_name',
                  'last_name', 'email', 'is_superuser')
        read_only_fields = ('id',)
        write_only_fields = ('password',)

    def restore_object(self, attrs, instance=None):
        user = super(UserSerializer, self).restore_object(attrs, instance)
        user.set_password(attrs['password'])
        return user


class HyperlinkedThumbField(serializers.ImageField):

    def get_attribute(self, obj):
        return obj

    def to_internal_value(self, data):
        return data

    def to_representation(self, obj):
        try:
            request = self.context.get('request', '')
            if not request and obj.request:
                request = obj.request
                params = request.data
            else:
                params = request.query_params
            dimensions = params.get('dimensions', '100x100')
            try:
                size = [int(item) for item in str(dimensions).split('x')[:2]]
                if len(size) == 1:
                    size = [size[0], size[0]]
            except:
                size = [100, 100]
            image = get_thumbnailer(obj.image)
            thumbnail_options = {'crop': False, 'size': size}
            thumb = image.get_thumbnail(thumbnail_options)

            # image_url = request.build_absolute_uri(thumb.url)
            image_url = thumb.url
            return image_url
        except Exception as e:
            return obj.image.path



# class HyperlinkedSorlImageField(serializers.ImageField):
#     def __init__(self, dimensions=None, options=None, *args, **kwargs):
#         if not options:
#             options = {}
#         self.dimensions = dimensions
#         self.options = options
#         super(HyperlinkedSorlImageField, self).__init__(*args, **kwargs)
#
#     def to_internal_value(self, value):
#         # if (self.dimensions):
#         #     image = get_thumbnail(value, self.dimensions, **self.options)
#         #     try:
#         #         request = self.context.get('request', None)
#         #         return request.build_absolute_uri(image.url)
#         #     except Exception as e:
#         #         return super(HyperlinkedSorlImageField, self).to_native(image.url)
#         # else:
#         #     return super(HyperlinkedSorlImageField, self).to_native(image.url)
#         return super(HyperlinkedSorlImageField, self).to_internal_value()
