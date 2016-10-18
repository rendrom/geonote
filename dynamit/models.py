# coding=utf-8
from __future__ import unicode_literals
from __future__ import print_function
from django.apps import apps
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db import models
from django.core.cache import cache
from django.db import router, connection
from django.db.models.signals import post_delete
from django.dispatch.dispatcher import receiver
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from dynamit import actions, utils
from dynamit.utils import unregister_dynamo, reregister_dynamo
from comments.models import Comment
from entry.models import Entry
from uploader.models import Images
import slugify

DJANGO_FIELD_MAP = {
    'dynamicbooleanfield':          ('django.db.models', 'BooleanField'),
    'dynamiccharfield':             ('django.db.models', 'CharField'),
    'dynamicdatefield':             ('django.db.models', 'DateField'),
    'dynamicdatetimefield':         ('django.db.models', 'DateTimeField'),
    'dynamicintegerfield':          ('django.db.models', 'IntegerField'),
    'dynamicpositiveintegerfield':  ('django.db.models', 'PositiveIntegerField'),
    'dynamicfloatfield':            ('django.db.models', 'FloatField'),
    'dynamictextfield':             ('django.db.models', 'TextField'),
    'dynamictimefield':             ('django.db.models', 'TimeField'),
    'dynamicurlfield':              ('django.db.models', 'UrlField'),
    'dynamicemailfield':            ('django.db.models', 'EmailField'),
}

DJANGO_FIELD_CHOICES = [
    ('Basic Fields', [(key, value[1]) for key, value in list(DJANGO_FIELD_MAP.items())])
]


def get_field_choices():
    return DJANGO_FIELD_CHOICES


class DynamitModel(models.Model):
    name = models.CharField(_('Название'),
                            help_text=_('Отображаемое название слоя'),
                            max_length=50)
    app = models.CharField(default='dynamit', max_length=50)
    create_date = models.DateTimeField(_('Дата создания'), default=timezone.now)
    change_date = models.DateTimeField(_('Дата обновления'), default=timezone.now)
    slug = models.SlugField(_('Путь'),
                            help_text=_('Обозначение в адресной строке. Латинскими буквами'),
                            max_length=50)
    # Layer fields
    description = models.TextField(_('Описание'), null=True, blank=True,
                            help_text=_('Подробное описание слоя'))
    is_public = models.BooleanField(_('Публичный слой'), default=False,)
    can_comment = models.BooleanField(_('Комментарии'), default=False,)
    photo_gallery = models.BooleanField(_('Фотогалерея'), default=False,)
    user = models.ForeignKey(User)
    entryname = models.CharField(_('Обозначение записей'), default='id', blank=True, null=True, max_length=50,
                                 help_text=_('Выберите колонку, которую будете использовать для обозначения записей'))

    @property
    def model_slug(self):
        """
        A slug field generated out of the name field
        """
        return slugify.slugify(self.name, only_ascii=True)

    @property
    def model_name(self):
        return '{}_{}'.format(self.user, self.slug)

    def uncache(self):
        """
        Removes the model this instance represents from Django's cache

        We need to remove the model from the cache whenever we change it
        otherwise it won't have the changes next time it's loaded
        """
        app_models = apps.all_models[self.app]
        if str(self.model_name) in app_models:
            del app_models[str(self.model_name.lower())]

    def uni(self):
        unival = []
        for f in self._meta.fields:
            if len(unival) < 3 and f.__class__ is models.CharField:
                unival.append(getattr(self, f.name))
        if len(unival) > 0:
            return u' '.join(unival)
        else:
            return self.model_name

    def as_model(self):
        attrs = {
            'objects': models.GeoManager()
        }

        class Meta:
            app_label = self.app
            verbose_name = self.name
        attrs['Meta'] = Meta
        attrs['__module__'] = 'dynamo.dynamic_apps.%s.models' % self.app
        attrs['__unicode__'] = self.uni
        for field in self.fields.all():
            attrs[field.field_name] = field.as_field()
        model = type(str(self.model_name), (Entry,), attrs)
        # TODO: проверить ограничения кэша
        self.uncache()
        return model

    def save(self, force_insert=False, force_update=False, using=None, **kwargs):
        using = using or router.db_for_write(self.__class__, instance=self)
        create = False
        old = None
        old_exist = self.__class__.objects.filter(pk=self.pk).exists()
        if self.pk is None or not old_exist:
            create = True
        if not create:
            old = self.__class__.objects.filter(pk=self.pk)[0]
            cache.delete(self.model_name)

        model = self.as_model()
        super(DynamitModel, self).save(force_insert, force_update, using)
        if create:
            actions.create(model, using)
        else:
            with connection.schema_editor() as schema_editor:
                old_model = old.as_model()
                old_db_table = old_model._meta.db_table
                new_db_table = model._meta.db_table
                schema_editor.alter_db_table(old_model, old_db_table, new_db_table)
                actions.update_content_type(old_model, model)
        reregister_dynamo(model)

    def __unicode__(self):
        return self.name

    class Meta:
        unique_together = ('user', 'slug',)
        verbose_name = _('Динамическая модель')
        verbose_name_plural = _('Динамические модели')


def create_uniq_name(name, field, user=None):
    name = unicode(name)
    filter_dict = {field: name}
    if user:
        filter_dict.update({'user': user})
    if DynamitModel.objects.filter(**filter_dict).exists():
        add = '_1'
        try:
            split = name.split('_')
            if len(split) > 1:
                add = '_'+str((int(split[len(split)-1]) + 1))
                name = name[:-2]
        except Exception as e:
            pass
        name += add
        name = create_uniq_name(name, field)
    return name


@receiver(post_delete, sender=DynamitModel)
def dynamitmodel_post_delete(sender, instance, **kwargs):
    model = instance.as_model()
    with connection.schema_editor() as schema_editor:
        schema_editor.delete_model(model)
    unregister_dynamo(model)
    actions.clean_content_type(model)
    c_type = ContentType.objects.get_for_model(model)
    Comment.objects.filter(content_type=c_type).delete()
    Images.objects.filter(content_type=c_type).delete()


class DynamitModelField(models.Model):
    name = models.SlugField(_('Системное название'), max_length=50,
                            help_text=_('Название колонки в базе данных'),)
    verbose_name = models.CharField(_('Название'), max_length=50,
                            help_text=_('Отображаемое название'),)
    field_type = models.CharField(_('Тип'), choices=get_field_choices(), max_length=128, null=False, blank=False,)
    null = models.BooleanField(_('Null'), default=True, null=False, blank=False,
                            help_text=_('Может содержать "null" значения?'),)
    blank = models.BooleanField(_('Blank'), default=True, null=False, blank=False,
                            help_text=_('Может быть пустым?'),)
    unique = models.BooleanField(_('Unique'), default=False, null=False, blank=False)
    default = models.CharField(_('Default value'), max_length=32, null=True, blank=True)
    help_text = models.CharField(_('Help Text'), max_length=256, null=True, blank=True,
                            help_text=_('Short description of the field\' purpose'),)
    model = models.ForeignKey(DynamitModel, related_name='fields', null=False, blank=False)
    order = models.IntegerField(verbose_name=_('Позиция поля'))

    class Meta:
        verbose_name = _('Dynamic Model Field')
        unique_together = (('model', 'name'),)
        ordering = ('order',)

    @property
    def field_slug(self):
        return slugify.slugify(self.name, only_ascii=True)

    @property
    def field_name(self):
        return self.field_slug

    def as_field(self):
        attrs = {
            'verbose_name': self.verbose_name,
            'blank': self.blank,
            'unique': self.unique,
            'help_text': self.help_text,
        }

        if self.default is not None and self.default != '':
            attrs['default'] = self.default

        field_class = None
        if self.field_type in DJANGO_FIELD_MAP:
            module, klass = DJANGO_FIELD_MAP[self.field_type]
            field_class = utils.get_module_attr(module, klass, models.CharField)

        if field_class is None:
            try:
                ctype = ContentType.objects.get(model=self.field_type)
                field_class = models.ForeignKey
                model_def = DynamitModel.objects.get(name__iexact=ctype.model, app__name__iexact=ctype.app_label)
                model_klass = model_def.as_model()
                attrs['to'] = model_klass
                if attrs['to'] is None:
                    del attrs['to']
                    raise Exception('Could not get model class from %s' % ctype.model)
            except Exception, e:
                print("Failed to set foreign key: %s" % e)
                field_class = None

        if field_class is None:
            print("No field class found for %s, using CharField as default" % self.field_type)
            field_class = models.CharField

        if field_class is models.CharField:
            attrs['max_length'] = 125
        if field_class is models.BooleanField:
            attrs['default'] = len(str(self.default))
        else:
            attrs['null'] = self.null

        f = field_class(**attrs)
        f.column = self.field_name
        return f

    def delete(self, using=None):
        with connection.schema_editor() as schema_editor:
            model_class = self.model.as_model()
            field = self.as_field()
            schema_editor.remove_field(model_class, field)
        super(DynamitModelField, self).delete(using)
        reregister_dynamo(self.model.as_model())

    def save(self, force_insert=False, force_update=False, using=None, **kwargs):
        model_class = self.model.as_model()
        field = self.as_field()
        with connection.schema_editor() as schema_editor:
            create = False
            if self.pk is None or not self.__class__.objects.filter(pk=self.pk).exists():
                create = True
            if create:
                schema_editor.add_field(model_class, field)
            else:
                old = self.__class__.objects.get(pk=self.pk)
                with connection.schema_editor() as schema_editor:
                    old_model = old.model.as_model()
                    old_fields = old_model._meta.fields
                    old_field, new_field = old.as_field(), field
                    # for f in old_fields:
                    #     if f.name == old.name:
                    #         old_field = f
                    schema_editor.alter_field(old_model, old_field, new_field)

        super(DynamitModelField, self).save(force_insert, force_update, using)
        reregister_dynamo(self.model.as_model())

    def __unicode__(self):
        return self.name


@receiver(post_delete, sender=DynamitModelField)
def dynamitmodelfield_post_delete(sender, instance, **kwargs):
    gt_in_order = sender.objects.filter(order__gt=instance.order, model=instance.model)
    for o in gt_in_order:
        o.order -= 1
        o.save()