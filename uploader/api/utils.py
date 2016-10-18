# coding=utf-8
from __future__ import unicode_literals
import sys
from django.contrib.gis.gdal import OGRGeometry
from django.contrib.gis.utils import LayerMapping, LayerMapError
from django.core.exceptions import ObjectDoesNotExist
from dynamit.models import create_uniq_name, DynamitModel
import slugify


def create_dynamit(file_name, geo_file, user):

    # Create DynamitModel instance:
    model_name = create_uniq_name(file_name, field='name', user=user)
    model_slug = create_uniq_name(model_name, field='slug', user=user)
    model_slug = slugify.slugify(model_slug, only_ascii=True)

    new_dynamit = DynamitModel.objects.create(name=model_name, slug=model_slug, user=user)
    # new_dynamit.save()
    order = 0
    mapping = {}
    for feature in geo_file:
        for field in feature:
            try:
                uniq = False
                field_type = 'dynamictextfield'
                if field.type == 0:
                    field_type = 'dynamicintegerfield'
                elif field.type == 2:
                    field_type = 'dynamicfloatfield'
                elif field.type == 4:
                    if field.width != 0 and field.width <= 125:
                        field_type = 'dynamiccharfield'
                elif field.type in [8, 9, 10, 11]:
                    field_type = 'dynamicdatetimefield'

                field_name = field.name if field.name != 'id' else 'id_field'

                order += 1
                slug_field_name = slugify.slugify(field_name, only_ascii=True)
                new_dynamit.fields.create(verbose_name=field_name, name=slug_field_name,
                                          field_type=field_type, null=True, blank=True, unique=uniq, order=order)
                mapping[slug_field_name] = field.name
            except Exception:
                pass
        break
    mapping['geom'] = str(geo_file.geom_type).upper()
    return new_dynamit, mapping


def create_response_status(new_entries, with_error=0, updated_entries=0):
    response_data = {}
    report_type = "success"
    result_str = 'Добавлено: ' + str(new_entries)
    if updated_entries:
        result_str += '; изменено: ' + str(updated_entries)
    if with_error:
        result_str += '; с ошибками: ' + str(with_error)
        report_type = "warning"
        if new_entries == 0 and updated_entries == 0:
            report_type = "error"

    response_data['type'] = report_type
    response_data['result'] = result_str
    return response_data


class CustomMapping(LayerMapping):
    def custom_save(self, verbose=False, fid_range=False, step=False,
         progress=False, silent=False, stream=sys.stdout, strict=False, meta_attrs=False):
        """
        Отличается от стандартного метода LayerMapping.save() дополнительными
        'мета'-атрибутами (например: user), которые используются при сохранении экземпляров.

        cm = CustomMapping(model, geo_file, mapping)
        cm.custom_save(**{'user': request.user})

        """

        default_range = self.check_fid_range(fid_range)

        # Setting the progress interval, if requested.
        if progress:
            if progress is True or not isinstance(progress, int):
                progress_interval = 1000
            else:
                progress_interval = progress

        def _save(feat_range=default_range, num_feat=0, num_saved=0, model_attrs=meta_attrs):
            if feat_range:
                layer_iter = self.layer[feat_range]
            else:
                layer_iter = self.layer

            for feat in layer_iter:
                num_feat += 1
                # Getting the keyword arguments
                try:
                    kwargs = self.feature_kwargs(feat)
                except LayerMapError as msg:
                    # Something borked the validation
                    if strict:
                        raise
                    elif not silent:
                        stream.write('Ignoring Feature ID %s because: %s\n' % (feat.fid, msg))
                else:
                    # Constructing the model using the keyword args
                    is_update = False
                    if self.unique:
                        # If we want unique models on a particular field, handle the
                        # geometry appropriately.
                        try:
                            # Getting the keyword arguments and retrieving
                            # the unique model.
                            u_kwargs = self.unique_kwargs(kwargs)
                            m = self.model.objects.using(self.using).get(**u_kwargs)
                            is_update = True

                            # Getting the geometry (in OGR form), creating
                            # one from the kwargs WKT, adding in additional
                            # geometries, and update the attribute with the
                            # just-updated geometry WKT.
                            geom = getattr(m, self.geom_field).ogr
                            new = OGRGeometry(kwargs[self.geom_field])
                            for g in new:
                                geom.add(g)
                            setattr(m, self.geom_field, geom.wkt)
                        except ObjectDoesNotExist:
                            # No unique model exists yet, create.
                            m = self.model(**kwargs)
                    else:
                        args = {}
                        args.update(kwargs)
                        args.update(model_attrs)
                        m = self.model(**args)

                    try:
                        # Attempting to save.
                        m.save(using=self.using)
                        num_saved += 1
                        if verbose:
                            stream.write('%s: %s\n' % ('Updated' if is_update else 'Saved', m))
                    except Exception as msg:
                        if strict:
                            # Bailing out if the `strict` keyword is set.
                            if not silent:
                                stream.write(
                                    'Failed to save the feature (id: %s) into the '
                                    'model with the keyword arguments:\n' % feat.fid
                                )
                                stream.write('%s\n' % kwargs)
                            raise
                        elif not silent:
                            stream.write('Failed to save %s:\n %s\nContinuing\n' % (kwargs, msg))

                # Printing progress information, if requested.
                if progress and num_feat % progress_interval == 0:
                    stream.write('Processed %d features, saved %d ...\n' % (num_feat, num_saved))

            # Only used for status output purposes -- incremental saving uses the
            # values returned here.
            return num_saved, num_feat

        if self.transaction_decorator is not None:
            _save = self.transaction_decorator(_save)

        nfeat = self.layer.num_feat
        if step and isinstance(step, int) and step < nfeat:
            # Incremental saving is requested at the given interval (step)
            if default_range:
                raise LayerMapError('The `step` keyword may not be used in conjunction with the `fid_range` keyword.')
            beg, num_feat, num_saved = (0, 0, 0)
            indices = range(step, nfeat, step)
            n_i = len(indices)

            for i, end in enumerate(indices):
                # Constructing the slice to use for this step; the last slice is
                # special (e.g, [100:] instead of [90:100]).
                if i + 1 == n_i:
                    step_slice = slice(beg, None)
                else:
                    step_slice = slice(beg, end)

                try:
                    num_feat, num_saved = _save(step_slice, num_feat, num_saved)
                    beg = end
                except:  # Deliberately catch everything
                    stream.write('%s\nFailed to save slice: %s\n' % ('=-' * 20, step_slice))
                    raise
        else:
            # Otherwise, just calling the previously defined _save() function.
            _save()
