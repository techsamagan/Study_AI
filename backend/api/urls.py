from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    register, user_profile, CustomTokenObtainPairView,
    DocumentViewSet, SummaryViewSet, FlashcardViewSet, dashboard_stats,
    create_checkout_session, verify_payment, stripe_webhook
)
from .admin_views import (
    admin_dashboard_stats, admin_users_list, admin_user_detail,
    admin_upgrade_user, admin_downgrade_user, admin_content_stats
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'summaries', SummaryViewSet, basename='summary')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')

urlpatterns = [
    # Authentication
    path('auth/register/', register, name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', user_profile, name='user_profile'),
    
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # Subscription
    path('subscription/checkout/', create_checkout_session, name='create_checkout_session'),
    path('subscription/verify/', verify_payment, name='verify_payment'),
    path('subscription/webhook/', stripe_webhook, name='stripe_webhook'),
    
    # Admin endpoints
    path('admin/dashboard/stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('admin/users/', admin_users_list, name='admin_users_list'),
    path('admin/users/<int:user_id>/', admin_user_detail, name='admin_user_detail'),
    path('admin/users/<int:user_id>/upgrade/', admin_upgrade_user, name='admin_upgrade_user'),
    path('admin/users/<int:user_id>/downgrade/', admin_downgrade_user, name='admin_downgrade_user'),
    path('admin/content/stats/', admin_content_stats, name='admin_content_stats'),
    
    # API endpoints
    path('', include(router.urls)),
]

