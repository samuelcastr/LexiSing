from django.urls import path
from app.text import views as text_views
urlpatterns = [path('text/formalize/', text_views.TextFormalizeView.as_view())]
