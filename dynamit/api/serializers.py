import itertools
from dynamit.models import DynamitModel, DynamitModelField
from rest_framework import serializers


class DynamitModelFieldSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ('id', 'verbose_name', 'name', 'field_type', 'null', 'blank', 'unique', 'default', 'help_text', 'order')
        read_only_fields = ('model',)
        model = DynamitModelField


class DynamitModelSerializer(serializers.ModelSerializer):
    fields = DynamitModelFieldSerializer(many=True, read_only=False)

    class Meta:
        fields = ('id', 'name', 'slug', 'description', 'is_public', 'can_comment', 'photo_gallery', 'fields', 'entryname')
        model = DynamitModel
        read_only_fields = ('user', 'create_date', 'change_date', 'app')

    def to_representation(self, instance):
        ret = super(self.__class__, self).to_representation(instance)
        user = instance.user
        ret['user'] = user.username
        return ret

    def update(self, instance, validated_data):
        valid_data = validated_data.pop('fields')
        self_data = self.data.get('fields', '')
        self_initial = self.initial_data.get('fields', '')
        v_ids = []
        if valid_data:
            for i, f in itertools.izip(self_initial, valid_data):
                v_id = i.get('id')
                try:
                    field = DynamitModelField.objects.get(id=i.get('id'))
                    for ff in f:
                        setattr(field, ff, f[ff])
                    field.save()
                except DynamitModelField.DoesNotExist:
                    DynamitModelField.objects.get_or_create(model=instance, **f)
                v_ids.append(v_id)

        for d in self_data:
            d_id = d.get('id')
            if d_id not in v_ids:
                DynamitModelField.objects.get(id=d_id).delete()

        for i_v in validated_data:
            setattr(instance, i_v, validated_data.get(i_v, ''))
        instance.save()
        return instance

    def create(self, validated_data):
        fields_data = validated_data.pop('fields')
        dynamit = DynamitModel.objects.create(**validated_data)
        if fields_data:
            # fields = []
            for f in fields_data:
                DynamitModelField.objects.get_or_create(model=dynamit, **f)
                # TODO: bulk create with db alter
                # field = DynamicModelField(model=dynamit, **f)
                # fields.append(field)
            # DynamicModelField.objects.bulk_create(fields)
        return dynamit


