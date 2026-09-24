from django.urls import path
from app.users import views as user_views
urlpatterns = [path('users/me/', user_views.UserProfileView.as_view()),path('users/', user_views.UsersListView.as_view()),path('health/', user_views.HealthCheckView.as_view())]
