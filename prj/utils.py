

def get_or_none(model, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        return None


def lower_keys(x):
    if isinstance(x, list):
        return [lower_keys(v) for v in x]
    if isinstance(x, dict):
        return dict((k.lower(), lower_keys(v)) for k, v in x.iteritems())
    return x


def parse_bool_string(the_string):
    return the_string[0].upper() == 'T'
