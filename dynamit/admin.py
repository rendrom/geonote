# coding=utf-8
from django.contrib import admin
from dynamit.models import DynamitModel, DynamitModelField
from dynamit.utils import reregister_in_admin, dynamo_exist

from prj.settings import DYNAMIT_IN_ADMIN


class ModelFieldInline(admin.TabularInline):
    model = DynamitModelField
    extra = 10


class DynamitModelAdmin(admin.ModelAdmin):
    fields = ('name',)
    search_fields = ('name',)
    list_display = ('name',)
    # list_filter = ('app',)
    inlines = [ModelFieldInline]


admin.site.register(DynamitModel, DynamitModelAdmin)


class DynamitModelFieldAdmin(admin.ModelAdmin):
    search_fields = ('name', 'slug', 'field_type')
    ordering = ('name',)
    list_display = ('name', 'slug', 'model')
    list_filter = ('model',)
#admin.site.register(DynamicModelField, DynamicModelFieldAdmin)


if dynamo_exist():
    if DYNAMIT_IN_ADMIN:
        for model in DynamitModel.objects.all():
            reregister_in_admin(model.as_model(), admin.ModelAdmin)
