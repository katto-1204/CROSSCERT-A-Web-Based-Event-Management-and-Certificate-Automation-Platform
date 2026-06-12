"""
Serializers for Participants app.
"""
from rest_framework import serializers
from .models import Evaluation, UserProfile, EventBookmark
from events.models import CheckIn
from django.contrib.auth.models import User


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for Evaluation model."""
    event_title = serializers.SerializerMethodField()
    event_id = serializers.SerializerMethodField()
    participant_name = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = ['id', 'registration', 'name', 'email', 'year_level', 
                  'content_rating', 'instructor_rating', 'facilities_rating', 
                  'overall_rating', 'organization_rating', 'time_management_rating',
                  'materials_rating', 'relevance_rating', 'recommendation_rating',
                  'feedback', 'most_liked', 'suggestions', 'image', 'submitted_at',
                  'event_title', 'event_id', 'participant_name']

    def validate(self, data):
        registration = data.get('registration') or getattr(self.instance, 'registration', None)
        if registration is None:
            return data

        if not registration.is_present:
            raise serializers.ValidationError('You must check in before submitting an evaluation.')

        try:
            check_in = registration.check_in
            if not check_in.check_out_at:
                raise serializers.ValidationError('You must check out before submitting an evaluation.')
        except CheckIn.DoesNotExist:
            raise serializers.ValidationError('Check-in record not found. Please complete event attendance first.')

        if registration.has_evaluated and self.instance is None:
            raise serializers.ValidationError('You have already submitted an evaluation for this event.')

        return data

    def get_event_title(self, obj):
        try:
            return obj.registration.event.title
        except:
            return "Unknown Event"

    def get_event_id(self, obj):
        try:
            return obj.registration.event.id
        except:
            return None

    def get_participant_name(self, obj):
        try:
            return f"{obj.registration.first_name} {obj.registration.last_name}"
        except:
            return obj.name or "Unknown Participant"


class EventBookmarkSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(source='event.id', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateField(source='event.date', read_only=True)
    event_location = serializers.CharField(source='event.location', read_only=True)
    event_cover_image = serializers.CharField(source='event.cover_image', read_only=True)

    class Meta:
        model = EventBookmark
        fields = [
            'id', 'event', 'event_id', 'event_title', 'event_date',
            'event_location', 'event_cover_image', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ParticipantSerializer(serializers.Serializer):
    """Serializer to represent and update a participant User + Profile."""
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField()
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    program = serializers.CharField(required=False, allow_blank=True)
    birthday = serializers.DateField(required=False, allow_null=True)

    def to_representation(self, instance: User):
        profile = getattr(instance, "profile", None)
        return {
            "id": instance.id,
            "email": instance.email,
            "username": instance.username,
            "first_name": instance.first_name or "",
            "last_name": instance.last_name or "",
            "department": getattr(profile, "department", "") if profile else "",
            "program": getattr(profile, "program", "") if profile else "",
            "birthday": getattr(profile, "birthday", None) if profile else None,
        }

    def update(self, instance: User, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.save()
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        if "department" in validated_data:
            profile.department = validated_data["department"]
        if "program" in validated_data:
            profile.program = validated_data["program"]
        if "birthday" in validated_data:
            profile.birthday = validated_data["birthday"]
        profile.save()
        return instance
