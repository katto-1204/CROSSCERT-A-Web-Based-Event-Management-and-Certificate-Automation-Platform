"""
Bookmark API for server-synced participant bookmarks.
"""
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from events.models import Event
from .models import EventBookmark
from .serializers import EventBookmarkSerializer


class BookmarkViewSet(viewsets.ModelViewSet):
    """Manage bookmarks for the authenticated user."""
    serializer_class = EventBookmarkSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return EventBookmark.objects.filter(user=self.request.user).select_related('event')

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event') or request.data.get('event_id')
        if not event_id:
            return Response({'detail': 'event or event_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        event = get_object_or_404(Event, pk=event_id)
        bookmark, created = EventBookmark.objects.get_or_create(user=request.user, event=event)
        if not created:
            return Response(
                EventBookmarkSerializer(bookmark).data,
                status=status.HTTP_200_OK,
            )
        return Response(EventBookmarkSerializer(bookmark).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def ids(self, request):
        """Return bookmarked event IDs for quick client-side checks."""
        event_ids = list(
            EventBookmark.objects.filter(user=request.user).values_list('event_id', flat=True)
        )
        return Response({'event_ids': event_ids})

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle bookmark on/off for an event."""
        event_id = request.data.get('event_id') or request.data.get('event')
        if not event_id:
            return Response({'detail': 'event_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        event = get_object_or_404(Event, pk=event_id)
        bookmark = EventBookmark.objects.filter(user=request.user, event=event).first()
        if bookmark:
            bookmark.delete()
            return Response({'bookmarked': False, 'event_id': int(event_id)})

        EventBookmark.objects.create(user=request.user, event=event)
        return Response({'bookmarked': True, 'event_id': int(event_id)})
