"""
Serializers for Participants app.
"""
from rest_framework import serializers
from .models import Evaluation, UserProfile
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
                  'overall_rating', 'feedback', 'submitted_at',
                  'event_title', 'event_id', 'participant_name']

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
