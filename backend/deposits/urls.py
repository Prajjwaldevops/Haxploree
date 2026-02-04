"""
URL routing for the Deposits API.
"""

from django.urls import path
from .views import DepositUploadView, HealthCheckView, DebugConfigView, TestUploadView


app_name = 'deposits'

urlpatterns = [
    path('upload/', DepositUploadView.as_view(), name='upload'),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('debug/', DebugConfigView.as_view(), name='debug'),
    path('test-upload/', TestUploadView.as_view(), name='test-upload'),
]
