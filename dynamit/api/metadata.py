# coding=utf-8
from __future__ import unicode_literals
from django.utils.encoding import force_text
from rest_framework import serializers

from rest_framework.metadata import BaseMetadata
from rest_framework.serializers import ListSerializer, OrderedDict
from rest_framework.utils.field_mapping import ClassLookupDict


class DynamitMetadata(BaseMetadata):
    label_lookup = ClassLookupDict({
        serializers.Field: 'field',
        serializers.BooleanField: 'boolean',
        serializers.CharField: 'string',
        serializers.URLField: 'url',
        serializers.EmailField: 'email',
        serializers.RegexField: 'regex',
        serializers.SlugField: 'slug',
        serializers.IntegerField: 'integer',
        serializers.FloatField: 'float',
        serializers.DecimalField: 'decimal',
        serializers.DateField: 'date',
        serializers.DateTimeField: 'datetime',
        serializers.TimeField: 'time',
        serializers.ChoiceField: 'choice',
        serializers.MultipleChoiceField: 'multiple choice',
        serializers.FileField: 'file upload',
        serializers.ImageField: 'image upload',
    })

    def determine_metadata(self, request, view):
        metadata = OrderedDict()
        serializer = view.get_serializer()
        metadata['actions'] = self.get_serializer_info(serializer)
        return metadata

    def get_serializer_info(self, serializer):
        if hasattr(serializer, 'child'):
            serializer = serializer.child

        field_array = {}
        for field_name, field in serializer.fields.items():
            if not isinstance(field, ListSerializer):
                field_info = self.get_field_info(field)
            else:
                field_info = self.get_serializer_info(field)
            field_array[field_name] = field_info
        return field_array

    def get_field_info(self, field):
        field_info = OrderedDict()
        field_info['type'] = self.label_lookup[field]
        field_info['required'] = getattr(field, 'required', False)

        for attr in ['read_only', 'label', 'help_text', 'min_length', 'max_length']:
            value = getattr(field, attr, None)
            if value is None and attr == 'max_length':
                try:
                    value = field._kwargs[attr]
                except:
                    value = None
            if value is not None and value != '':
                field_info[attr] = force_text(value, strings_only=True)

        if hasattr(field, 'choices'):
            field_info['choices'] = [
                {
                    'value': choice_value,
                    'display_name': force_text(choice_name, strings_only=True)
                }
                for choice_value, choice_name in field.choices.items()
            ]

        return field_info
