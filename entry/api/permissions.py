from django.contrib.auth.models import User
from dynamit.models import DynamitModel
from rest_framework import permissions


class IsStaffOrTargetUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.user == request.user


class IsStaffOrDynamitOwner(permissions.BasePermission):

    def has_permission(self, request, view):
        dynamit = view.kwargs.get('dynamit')
        return request.user and (request.user == dynamit.user or request.user.is_staff)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.user


class IsPublicOrDynamitUser(permissions.BasePermission):
    def has_permission(self, request, view):
        dynamit = view.kwargs.get('dynamit')
        return (request.user == dynamit.user or request.user.is_staff) or dynamit.is_public


class IsAuthenticatedOrPublic(permissions.BasePermission):

    def has_permission(self, request, view):
        dynamit = view.kwargs.get('dynamit')
        return request.user and request.user.is_authenticated() and ((request.user == dynamit.user or request.user.is_staff) or dynamit.is_public)