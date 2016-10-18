# coding=utf-8
from __future__ import unicode_literals, print_function
from django.contrib.gis.gdal import DataSource
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from dynamit.api.serializers import DynamitModelSerializer
from uploader.api.utils import create_dynamit, CustomMapping, create_response_status
from uploader.models import Upload
import slugify


class DynamitUploadView(APIView):
    parser_classes = (FormParser, MultiPartParser,)
    permission_classes = (IsAuthenticated,)

    def post(self, request, format=None):
        file_obj = request.data['file']
        with_error = 0
        new_entries = 0
        response = {}
        if file_obj:
            file_name = unicode(file_obj.name)
            file_name_parts = file_name.split(".")
            file_type = ""
            if len(file_name_parts) > 1:
                file_type = file_name_parts[-1]
                file_name = file_name_parts[:-1]
            file_name = slugify.slugify(file_name, only_ascii=True)
            file_obj.name = "%s.%s" % (file_name, file_type)
            upload = Upload(upload=file_obj, user=request.user)
            upload.name = file_name
            upload.save()
            geo_file = DataSource(upload.upload.path)
            for layer in geo_file:
                try:
                    new_dynamit, mapping = create_dynamit(file_name, layer, request.user)
                    model = new_dynamit.as_model()
                    cm = CustomMapping(model, geo_file, mapping)
                    cm.custom_save(meta_attrs={'user': request.user})
                    new_entries += layer.num_feat
                    response['dynamit'] = DynamitModelSerializer(new_dynamit).data
                except Exception as e:
                    print(e.message)
                break

            response['status'] = create_response_status(new_entries=new_entries, with_error=with_error)
            return Response(status=200, data=response)
        response['status'] = {'type': 'error', 'result': 'Произошла ошибка при записи в базу данных'}
        return Response(status=400, data=response)
