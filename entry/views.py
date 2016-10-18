# coding=utf-8
from comments.models import Comment
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import connection
from django.http import HttpResponseRedirect, HttpResponseForbidden, HttpResponse
from django.views.generic import TemplateView
from dynamit.models import DynamitModel
from string import Template
from uploader.models import Upload
import json
import urllib
import urllib2


class IndexPage(TemplateView):
    template_name = "page/index.html"

    def get_context_data(self, **kwargs):
        context = super(IndexPage, self).get_context_data(**kwargs)
        js_debug = 1 if settings.JS_DEBUG else 0
        context['JSDEBUG'] = js_debug
        context['SERVER_NAMES'] = settings.NAMES
        return context


@login_required()
def delete_all_entry(request):
    if request.user.is_superuser:
        DynamitModel.objects.all().delete()
        Comment.objects.all().delete()
        Upload.objects.all().delete()
        messages.success(request, 'Данные успешно удалены.')
        return HttpResponseRedirect('/')
    return HttpResponseForbidden()

