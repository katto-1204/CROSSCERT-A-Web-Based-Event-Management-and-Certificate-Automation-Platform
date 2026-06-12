"""
Participant models for CROSSCERT.
"""
from django.db import models
from django.contrib.auth.models import User
from events.models import Event, EventRegistration


class UserProfile(models.Model):
    """User profile model to store additional user information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=200, blank=True)
    program = models.CharField(max_length=200, blank=True)
    birthday = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Profile for {self.user.email}"


class EventBookmark(models.Model):
    """Server-synced event bookmark for a participant."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_bookmarks')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} bookmarked {self.event.title}"


class Evaluation(models.Model):
    """Evaluation model for participant feedback."""
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='evaluation')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    year_level = models.CharField(max_length=50)
    
    # Original rating fields
    content_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    instructor_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    facilities_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    overall_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    
    # New rating fields
    organization_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=4, help_text="How well was the event organized?")
    time_management_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=4, help_text="Was the event on schedule?")
    materials_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=4, help_text="Quality of materials/handouts")
    relevance_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=4, help_text="Relevance to your field/studies")
    recommendation_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], default=4, help_text="Would you recommend this event?")
    
    # Text feedback fields
    feedback = models.TextField(blank=True)
    most_liked = models.TextField(blank=True, help_text="What did you like most about the event?")
    suggestions = models.TextField(blank=True, help_text="Suggestions for improvement")
    image = models.TextField(blank=True, null=True, help_text="Base64 encoded image")
    
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation by {self.name} for {self.registration.event.title}"
