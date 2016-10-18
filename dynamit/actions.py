import sys
from django.core.management.sql import emit_post_migrate_signal, emit_pre_migrate_signal
from django.db import connections, transaction, DEFAULT_DB_ALIAS
from django.contrib.contenttypes.models import ContentType
from django.core.management.color import no_style
from django.utils.encoding import smart_unicode
import logging

logger = logging.getLogger('default')


def create(model, using):
    """ Mostly lifted from django.core.management.commands.migrate """

    # Get database connection and cursor
    db = using or DEFAULT_DB_ALIAS
    connection = connections[db]
    cursor = connection.cursor()
    try:
        # Get a list of already installed *models* so that references work right.
        tables = connection.introspection.table_names()
        seen_models = connection.introspection.installed_models(tables)
        created_models = set()
        pending_references = {}

        # Abort if the table we're going to create already exists
        if model._meta.db_table in tables:
            return

        emit_pre_migrate_signal(0, False, connection.alias)
        # with transaction.atomic(using=connection.alias, savepoint=False):
        #     sql, references = connection.creation.sql_create_model(model, no_style(), seen_models)
        #     seen_models.add(model)
        #     created_models.add(model)
        #     for refto, refs in references.items():
        #         pending_references.setdefault(refto, []).extend(refs)
        #         if refto in seen_models:
        #             sql.extend(connection.creation.sql_for_pending_references(refto, no_style(), pending_references))
        #     sql.extend(connection.creation.sql_for_pending_references(model, no_style(), pending_references))
        #
        #     for statement in sql:
        #         cursor.execute(statement)
        #     custom_sql = custom_sql_for_model(model, no_style(), connection)
        #     for sql in custom_sql:
        #         cursor.execute(sql)
        #     index_sql = connection.creation.sql_indexes_for_model(model, no_style())
        #     for sql in index_sql:
        #         cursor.execute(sql)
        #     tables.append(connection.introspection.table_name_converter(model._meta.db_table))
        with transaction.atomic(using=connection.alias, savepoint=connection.features.can_rollback_ddl):
            deferred_sql = []

            if model._meta.can_migrate(connection):
                with connection.schema_editor() as editor:
                    editor.create_model(model)
                    deferred_sql.extend(editor.deferred_sql)
                    editor.deferred_sql = []
                created_models.add(model)

            for statement in deferred_sql:
                cursor.execute(statement)

    finally:
        cursor.close()

    # Send the post_syncdb signal, so individual apps can do whatever they need
    # to do at this point.
    emit_post_migrate_signal(0, False, connection.alias)
    create_content_type(model)


def create_content_type(model):
    opts = model._meta
    try:
        ct = ContentType.objects.get(app_label=opts.app_label,
                                     model=opts.object_name.lower())
    except ContentType.DoesNotExist:
        ct = ContentType(app_label=opts.app_label, model=opts.object_name.lower())
    ct.save()


def clean_content_type(model):
    opts = model._meta
    try:
        ContentType.objects.get(app_label=opts.app_label, model=opts.object_name.lower()).delete()
    except ContentType.DoesNotExist:
        pass


def update_content_type(old_model, new_model):
    opts = old_model._meta
    new_opts = new_model._meta
    if opts.object_name.lower() != new_opts.object_name.lower() or opts.app_label != new_opts.app_label:
        try:
            ct = ContentType.objects.get(app_label=opts.app_label,
                                         model=opts.object_name.lower())
            ct.app_lable = new_opts.app_label
            ct.model = new_opts.object_name.lower()
            ct.save()
        except ContentType.DoesNotExist:
            pass
