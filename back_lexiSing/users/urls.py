from django.urls import path
from .views import HealthCheckView, UserProfileView, ConversationsListView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('users/me/', UserProfileView.as_view(), name='user-profile'),
    path('conversations/', ConversationsListView.as_view(), name='conversations-list'),
]
