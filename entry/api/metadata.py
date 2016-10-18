# coding=utf-8
from __future__ import unicode_literals


from django.utils.encoding import force_text
from entry.models import Entry
from rest_framework import serializers
from rest_framework.metadata import BaseMetadata
from rest_framework.utils.field_mapping import ClassLookupDict
from rest_framework.serializers import OrderedDict



def get_panels(from_model):
    panels = []
    # infofields = ['entryid']
    infofields = []
    cleaned_fields = clean_fields(from_model, Entry)
    for f in cleaned_fields:
        infofields.append(f)
    if infofields:
        panels.append({
                  'id': 'entryinfo',
                  'title': 'Информация',
                  'collapsed': False,
                  'fields': infofields
              }),
    panels.append({
                  'id': 'entryaddr',
                  'title': 'Местоположение',
                  'collapsed': True,
                  'fields': ['latlng', 'geom'],
                  'edit_only': ['geom'],
                  'custom_edit_template': {
                      'geom': 'geom.html',
                      'latlng': 'latlng.html'
                    }
                   })
    return panels


def clean_fields(from_model, parent):
    """
    :param fields: Модель из полей которой нужно убрать поля родительской модели
    :param parent: та самая родительская модель
    :return: отфильтрованный список названий полей
    """
    fields = from_model._meta.fields
    cleaned_fields_name = []
    parent_fields = parent._meta.fields
    parent_fields_name = []
    for item in parent_fields:
        parent_fields_name.append(item.name)
    for f in fields:
        if f.name not in parent_fields_name and f.name != 'id':
            cleaned_fields_name.append(f.name)

    return cleaned_fields_name


class EntryMetadata(BaseMetadata):
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
        dynamit = view.kwargs.get('dynamit')
        # metadata['name'] = view.get_view_name()
        metadata['description'] = view.get_view_description()
        # metadata['renders'] = [renderer.media_type for renderer in view.renderer_classes]
        # metadata['parses'] = [parser.media_type for parser in view.parser_classes]
        model = view.serializer_class.Meta.model
        metadata['panels'] = get_panels(model)
        metadata['title'] = model._meta.original_attrs
        metadata['dynamit'] = {
            'user': dynamit.user.username,
            'is_public': dynamit.is_public,
            'can_comment': dynamit.can_comment,
            'photo_gallery': dynamit.photo_gallery
        }
        metadata['entry_count'] = view.queryset.count()
        serializer = view.get_serializer()
        metadata['actions'] = self.get_serializer_info(serializer)
        return metadata


    def get_serializer_info(self, serializer):
        if hasattr(serializer, 'child'):
            serializer = serializer.child
        return OrderedDict([
            (field_name, self.get_field_info(field))
            for field_name, field in serializer.fields.items()
        ])

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
