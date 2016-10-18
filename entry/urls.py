from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from entry import views

urlpatterns = [
    url(r'^delete_all_entry/$', views.delete_all_entry, name='delete_all_entry'),
]