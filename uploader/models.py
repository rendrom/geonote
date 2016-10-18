# coding=utf-8
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils.encoding import python_2_unicode_compatible, force_text
from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils.translation import ugettext_lazy as _


@python_2_unicode_compatible
class Upload(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=255)
    upload = models.FileField(upload_to='uploads/%Y/%m/%d')
    date = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = u"Загруженный файл"
        verbose_name_plural = u"Загружаемый контент"

    def __str__(self):
        return u'%s' % self.name


class ImageManager(models.Manager):

    def for_model(self, model):
        ct = ContentType.objects.get_for_model(model)
        qs = self.get_queryset().filter(content_type=ct)
        if isinstance(model, models.Model):
            qs = qs.filter(object_pk=force_text(model._get_pk_val()))
        return qs


@python_2_unicode_compatible
class Images(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='images/%Y/%m/%d')
    create_date = models.DateTimeField('Дата создания', default=timezone.now)
    change_date = models.DateTimeField('Дата обновления', default=timezone.now)

    # Content-object field
    content_type = models.ForeignKey(ContentType,
            verbose_name=_('content type'),
            related_name="content_type_set_for_%(class)s")
    object_pk = models.TextField(_('object ID'))
    content_object = GenericForeignKey(ct_field="content_type", fk_field="object_pk")

    objects = ImageManager()

    class Meta:
        verbose_name = u"Изображение"
        verbose_name_plural = u"Изображения"

    def __str__(self):
        return u'%s' % self.name

