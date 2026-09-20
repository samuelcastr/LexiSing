from django.urls import path
from .views import (
    HealthCheckView,
    UserProfileView,
    ConversationsListView,
    UsersListView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view()),
    path('users/me/', UserProfileView.as_view()),
    path('conversations/', ConversationsListView.as_view()),
    path('users/', UsersListView.as_view()),
]