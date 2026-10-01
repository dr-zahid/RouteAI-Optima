from django.urls import path
from .views import RoutePlannerView, FuelStatsView

urlpatterns = [
    path('route/', RoutePlannerView.as_view(), name='route-planner'),
    path('fuel-stats/', FuelStatsView.as_view(), name='fuel-stats'),
]
