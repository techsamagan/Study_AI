"""
Admin API views for managing users, subscriptions, and content
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Document, Summary, Flashcard
from .serializers import UserSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    total_users = User.objects.count()
    pro_users = User.objects.filter(plan_type='pro', subscription_status='active').count()
    free_users = User.objects.filter(plan_type='free').count()
    
    # Recent signups (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_signups = User.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # Total content
    total_documents = Document.objects.count()
    total_summaries = Summary.objects.count()
    total_flashcards = Flashcard.objects.count()
    
    # Content created in last 30 days
    recent_documents = Document.objects.filter(uploaded_at__gte=thirty_days_ago).count()
    recent_summaries = Summary.objects.filter(created_at__gte=thirty_days_ago).count()
    recent_flashcards = Flashcard.objects.filter(created_at__gte=thirty_days_ago).count()
    
    # Revenue (if you track payments)
    active_pro_subscriptions = User.objects.filter(
        plan_type='pro',
        subscription_status='active'
    ).count()
    
    stats = {
        'users': {
            'total': total_users,
            'pro': pro_users,
            'free': free_users,
            'recent_signups': recent_signups,
        },
        'content': {
            'total_documents': total_documents,
            'total_summaries': total_summaries,
            'total_flashcards': total_flashcards,
            'recent_documents': recent_documents,
            'recent_summaries': recent_summaries,
            'recent_flashcards': recent_flashcards,
        },
        'subscriptions': {
            'active_pro': active_pro_subscriptions,
        }
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    """Get list of all users with pagination"""
    from rest_framework.pagination import PageNumberPagination
    
    class AdminUserPagination(PageNumberPagination):
        page_size = 20
        page_size_query_param = 'page_size'
        max_page_size = 100
    
    paginator = AdminUserPagination()
    
    # Get filter parameters
    plan_type = request.query_params.get('plan_type', None)
    search = request.query_params.get('search', None)
    
    queryset = User.objects.all()
    
    if plan_type:
        queryset = queryset.filter(plan_type=plan_type)
    
    if search:
        queryset = queryset.filter(
            Q(email__icontains=search) |
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    queryset = queryset.order_by('-created_at')
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = UserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = UserSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, user_id):
    """Get or update user details"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        # Allow admin to update user plan
        plan_type = request.data.get('plan_type')
        subscription_status = request.data.get('subscription_status')
        
        if plan_type and plan_type in ['free', 'pro']:
            user.plan_type = plan_type
        
        if subscription_status:
            user.subscription_status = subscription_status
        
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_upgrade_user(request, user_id):
    """Manually upgrade a user to Pro (admin only)"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from datetime import timedelta
    
    user.plan_type = 'pro'
    user.subscription_status = 'active'
    user.subscription_start_date = timezone.now()
    user.subscription_end_date = timezone.now() + timedelta(days=30)
    user.save()
    
    serializer = UserSerializer(user)
    return Response({
        'message': f'User {user.email} upgraded to Pro successfully',
        'user': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_downgrade_user(request, user_id):
    """Manually downgrade a user to Free (admin only)"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user.plan_type = 'free'
    user.subscription_status = 'cancelled'
    user.save()
    
    serializer = UserSerializer(user)
    return Response({
        'message': f'User {user.email} downgraded to Free successfully',
        'user': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_content_stats(request):
    """Get content statistics"""
    # Documents by type
    documents_by_type = Document.objects.values('file_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Flashcards by category
    flashcards_by_category = Flashcard.objects.values('category').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Average mastery level
    avg_mastery = Flashcard.objects.aggregate(
        avg_mastery=Avg('mastery_level')
    )['avg_mastery'] or 0
    
    # Top users by content
    top_users_documents = User.objects.annotate(
        doc_count=Count('documents')
    ).order_by('-doc_count')[:10]
    
    top_users_flashcards = User.objects.annotate(
        flashcard_count=Count('flashcards')
    ).order_by('-flashcard_count')[:10]
    
    stats = {
        'documents_by_type': list(documents_by_type),
        'flashcards_by_category': list(flashcards_by_category),
        'average_mastery': round(avg_mastery, 2),
        'top_users_documents': [
            {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'count': user.doc_count
            }
            for user in top_users_documents
        ],
        'top_users_flashcards': [
            {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'count': user.flashcard_count
            }
            for user in top_users_flashcards
        ],
    }
    
    return Response(stats)

