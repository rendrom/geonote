from django.conf import settings
from django.contrib.admin.sites import NotRegistered
from django.core.urlresolvers import clear_url_caches
from django.db import connection
from importlib import import_module
from django.contrib import admin
from prj.settings import DYNAMIT_IN_ADMIN


def dynamo_exist():
    cursor = connection.cursor()
    cursor.execute("""
        SELECT EXISTS(
            SELECT 1
            FROM   pg_catalog.pg_class c
            JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE  n.nspname = 'public'
            AND    c.relname = 'dynamo_dynamicmodel'
        );
    """)
    exist = cursor.fetchone()[0]
    return exist


def get_module_attr(module, attr, fallback=None):
    m = import_module(module)
    return getattr(m, attr, fallback)


def unregister_dynamo(model):
    if DYNAMIT_IN_ADMIN:
        unregister_from_admin(model)
        reload(import_module(settings.ROOT_URLCONF))
        clear_url_caches()


def reregister_dynamo(model):
    if DYNAMIT_IN_ADMIN:
        reregister_in_admin(model)
        reload(import_module(settings.ROOT_URLCONF))
        clear_url_caches()


def unregister_from_admin(model):
    for reg_model in admin.site._registry.keys():
        if model._meta.db_table == reg_model._meta.db_table:
            del admin.site._registry[reg_model]

    try:
        admin.site.unregister(model)
    except NotRegistered:
        pass


def reregister_in_admin(model, admin_class=None):
    if admin_class is None:
        admin_class = admin.ModelAdmin
    unregister_from_admin(model)
    admin.site.register(model, admin_class)



