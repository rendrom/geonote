from django.contrib import admin
from uploader.models import Upload, Images


admin.site.register(Upload, admin.ModelAdmin)
admin.site.register(Images, admin.ModelAdmin)
