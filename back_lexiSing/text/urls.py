from django.urls import path

from .views import TextFormalizeView

urlpatterns = [
    path('text/formalize/', TextFormalizeView.as_view(), name='text-formalize'),
]
