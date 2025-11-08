"""
Admin API views for managing users and content
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg
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
    
    stats = {
        'users': {
            'total': total_users,
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
    search = request.query_params.get('search', None)
    
    queryset = User.objects.all()
    
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
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

