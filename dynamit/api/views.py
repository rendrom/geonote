# coding=utf-8
from django.contrib.auth.models import User
from django.db.models import Q
from dynamit.api.metadata import DynamitMetadata
from dynamit.api.serializers import DynamitModelSerializer, DynamitModelFieldSerializer
from dynamit.models import DynamitModel, DynamitModelField
from entry.api import permissions
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated


class DynamitModelViewSet(viewsets.ModelViewSet):
    queryset = DynamitModel.objects.all().order_by('-create_date')
    serializer_class = DynamitModelSerializer
    metadata_class = DynamitMetadata

    def get_queryset(self):
        user = self.request.user
        if isinstance(self.request.user, User):
            q = DynamitModel.objects.filter(Q(is_public=True) | Q(user=user)).order_by('-change_date')
        else:
            q = DynamitModel.objects.filter(is_public=True).order_by('-change_date')
        return q

    def perform_create(self, serializer):
        if isinstance(self.request.user, User):
            serializer.save(user=self.request.user)

    def get_permissions(self):
            if self.request.method == 'GET':
                return AllowAny(),
            else:
                return (IsAuthenticated() if self.request.method == 'POST'
                        else permissions.IsStaffOrTargetUser()),


class DynamitModelFieldViewSet(viewsets.ModelViewSet):
    queryset = DynamitModelField.objects.all()
    serializer_class = DynamitModelFieldSerializer

    def get_permissions(self):
            if self.request.method == 'GET':
                return AllowAny(),
            else:
                return (IsAuthenticated() if self.request.method == 'POST'
                        else permissions.IsStaffOrTargetUser()),

