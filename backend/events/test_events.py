"""Event API tests."""
from datetime import date, timedelta

from django.test import TestCase
from django.contrib.auth.models import User

from events.models import Event
from events.serializers import EventSerializer


class EventValidationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', email='admin@hcdc.edu.ph', password='pass12345')
        self.user.is_staff = True
        self.user.save()

    def test_event_date_must_be_two_days_ahead(self):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        serializer = EventSerializer(data={
            'title': 'Future Event',
            'description': 'Test event',
            'date': tomorrow,
            'start_time': '09:00',
            'end_time': '17:00',
            'location': 'Main Hall',
            'is_public': True,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('date', serializer.errors)

    def test_valid_event_date_passes(self):
        future = (date.today() + timedelta(days=3)).isoformat()
        serializer = EventSerializer(data={
            'title': 'Valid Event',
            'description': 'Test event',
            'date': future,
            'start_time': '09:00',
            'end_time': '17:00',
            'location': 'Main Hall',
            'is_public': True,
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)


class PublicEventsTests(TestCase):
    def test_public_events_list(self):
        organizer = User.objects.create_user(username='org', email='org@hcdc.edu.ph', password='pass12345')
        Event.objects.create(
            title='Public Workshop',
            date=date.today() + timedelta(days=5),
            start_time='09:00',
            end_time='12:00',
            location='Lab',
            organizer=organizer,
            is_public=True,
        )
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)
