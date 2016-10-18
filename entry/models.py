# coding=utf-8
from __future__ import unicode_literals
from django.contrib.gis.geos import Polygon
from django.utils.encoding import python_2_unicode_compatible
from comments.models import Comment
from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.utils import timezone


ENTRY_TYPE = (
    (0, 'case'),
    (1, 'point'),
    (2, 'line'),
    (3, 'polygon'),
)


@python_2_unicode_compatible
class Entry(models.Model):
    user = models.ForeignKey(User)
    create_date = models.DateTimeField('Дата создания', default=timezone.now)
    change_date = models.DateTimeField('Дата обновления', default=timezone.now)
    geom = models.GeometryField('На карте', null=True, blank=True)

    class Meta:
        abstract = True
        verbose_name = 'запись'
        verbose_name_plural = 'Записи'

    def __str__(self):
        return self.entryid

    def get_geom(self):
        entries = self.entry_set.exclude(geom=None)
        if entries:
            poly = entries.extent()
            geom = Polygon.from_bbox(poly)
        else:
            geom = None
        return geom

    def resave_geom(self):
        self.geom = self.get_geom()
        self.save()
