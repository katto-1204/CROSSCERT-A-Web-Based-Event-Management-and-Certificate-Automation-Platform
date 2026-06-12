"""Participant / bookmark tests."""
from datetime import date, timedelta

from django.test import TestCase
from django.contrib.auth.models import User

from events.models import Event
from participants.models import EventBookmark


class BookmarkTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='p1', email='p1@hcdc.edu.ph', password='pass12345')
        self.client.login(username='p1', password='pass12345')
        organizer = User.objects.create_user(username='org2', email='org2@hcdc.edu.ph', password='pass12345')
        self.event = Event.objects.create(
            title='Bookmark Test Event',
            date=date.today() + timedelta(days=5),
            start_time='09:00',
            end_time='12:00',
            location='Hall',
            organizer=organizer,
            is_public=True,
        )

    def test_toggle_bookmark(self):
        response = self.client.post(
            '/api/bookmarks/toggle/',
            data={'event_id': self.event.id},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['bookmarked'])
        self.assertEqual(EventBookmark.objects.filter(user=self.user, event=self.event).count(), 1)

        response2 = self.client.post(
            '/api/bookmarks/toggle/',
            data={'event_id': self.event.id},
            content_type='application/json',
        )
        self.assertFalse(response2.json()['bookmarked'])

    def test_bookmark_ids(self):
        EventBookmark.objects.create(user=self.user, event=self.event)
        response = self.client.get('/api/bookmarks/ids/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(self.event.id, response.json()['event_ids'])
