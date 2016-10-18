# coding=utf-8
from django.contrib.gis.geos import Point, GEOSGeometry, Polygon
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from string import Template
from rest_framework.exceptions import ParseError
from rest_framework.filters import BaseFilterBackend


class InRegionFilter(BaseFilterBackend):
    region_param = 'in_region'  # The URL query parameter which contains the region Lat, Lng, Zoomlevel.

    def get_filter_region(self, request):
        region_string = request.query_params.get(self.region_param, None)
        if not region_string:
            return None
        poly = get_osm_poly_from_query(region_string)
        return poly

    def filter_queryset(self, request, queryset, view):
        region_string = request.query_params.get(self.region_param, None)
        data = cache.get(region_string)
        if data is None:
            filter_field = getattr(view, 'bbox_filter_field', None)
            # include_overlapping = getattr(view, 'bbox_filter_include_overlapping', False)

            geoDjango_filter = 'intersects'
            if not filter_field:
                return queryset
            region = self.get_filter_region(request)
            if not region:
                return queryset

            data = queryset.filter(Q(**{'%s__%s' % (filter_field, geoDjango_filter): region}))
            data_for_cache = set(data.values_list('id', flat=True))
            try:
                # TODO: установить время, настроить memecache, проверка по OSMID
                cache.set(region_string, data_for_cache, 60*3)
            except Exception as e:
                print e.message
            return data
        else:
            to_return = queryset.filter(id__in=data)
            return to_return


def get_osm_poly_from_query(region_string):
    poly = get_region_multipolygon(region_string)
    if poly:
        geom = GEOSGeometry(poly[0])
        return geom
    return None


zoom_adm_matching = {
    3: "<='3'",
    4: "<='4'",
    5: "<='4'",
    6: "<='4'",
    7: "<='6'",
    8: "<='6'",
    9: "<='6'",
    10: "<='6'",
    11: "<='8'",
    12: "<='8'",
    13: "<='8'",
    14: "<='11'"
}


def get_region_multipolygon(point, geom_column='way', id_field='osm_id', from_srid=900913, to_srid=4326):
    cursor = connection.cursor()
    try:
        y, x, zoom = (float(n) for n in point.split(','))
        zoom = int(zoom)
    except ValueError:
        raise ParseError("Not valid region string in parameter")
    adm_level = "<='4'"

    if zoom in zoom_adm_matching:
        adm_level = zoom_adm_matching[zoom]
    elif zoom < min(zoom_adm_matching.keys()):
        adm_level = zoom_adm_matching[min(zoom_adm_matching.keys())]
    elif zoom > max(zoom_adm_matching.keys()):
        adm_level = zoom_adm_matching[max(zoom_adm_matching.keys())]

    center = Template("ST_Transform(ST_Setsrid(ST_Makepoint($x,$y), $to_srid), $from_srid)").substitute(locals())

    sql = Template("""
        WITH lg as
        (
         SELECT osm_id, way
         FROM planet_osm_polygon AS osm
         WHERE cast(admin_level as int) $adm_level
         AND ST_Intersects(way, $center)
         AND boundary = 'administrative'
         ORDER BY admin_level DESC
         LIMIT 1
        )
        SELECT
         ST_Transform(ST_BufFer(ST_Collect(planet_osm_polygon.way),0), 4326)
        FROM
         planet_osm_polygon,
         lg
        WHERE planet_osm_polygon.osm_id = lg.osm_id
    """)
    cursor.execute(sql.substitute(locals()))
    return cursor.fetchone()
