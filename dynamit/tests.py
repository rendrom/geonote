"""
This file demonstrates two different styles of tests (one doctest and one
unittest). These will both pass when you run "manage.py test".

Replace these with more appropriate tests for your application.
"""

from django.test import TestCase

class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.failUnlessEqual(1 + 1, 2)

__test__ = {"doctest": """
Another way to test that 1 + 1 is equal to 2.

>>> 1 + 1 == 2
True
"""}

def mktestmodel():
    from dynamit import models
    test, created = models.DynamitModel.objects.get_or_create(name='Test')
    foo, created = models.DynamitModelField.objects.get_or_create(
        name = 'foo',
        model = test,
        field_type = 'dynamiccharfield',
        null = True,
        blank = True,
        unique = False,
        help_text = 'Test field for Foo',
    )
    bar, created = models.DynamitModelField.objects.get_or_create(
        name = 'bar',
        slug = 'bar_slug',
        model = test,
        field_type = 'dynamiccharfield',
        null = True,
        blank = True,
        unique = False,
        help_text = 'Test field for Bar',
    )
    ifield, created = models.DynamitModelField.objects.get_or_create(
        name = 'ifield',
        slug = 'ifield',
        field_type = 'dynamicintegerfield',
        help_text = 'hope this helps',
        model = test
    )
    return test
    
model = mktestmodel()

