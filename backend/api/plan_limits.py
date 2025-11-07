"""
Plan limits configuration for Free and Pro plans
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q
from .models import User, Document, Summary, Flashcard


def check_document_limit(user):
    """Check if user can upload more documents this month"""
    limits = user.get_plan_limits()
    if limits['documents_per_month'] == -1:
        return True, None
    
    # Count documents uploaded this month
    start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    documents_this_month = Document.objects.filter(
        user=user,
        uploaded_at__gte=start_of_month
    ).count()
    
    remaining = limits['documents_per_month'] - documents_this_month
    if remaining > 0:
        return True, remaining
    return False, 0


def check_summary_limit(user):
    """Check if user can generate more summaries this month"""
    limits = user.get_plan_limits()
    if limits['summaries_per_month'] == -1:
        return True, None
    
    # Count summaries generated this month
    start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    summaries_this_month = Summary.objects.filter(
        user=user,
        created_at__gte=start_of_month
    ).count()
    
    remaining = limits['summaries_per_month'] - summaries_this_month
    if remaining > 0:
        return True, remaining
    return False, 0


def check_flashcard_limit(user):
    """Check if user can create more flashcards this month"""
    limits = user.get_plan_limits()
    if limits['flashcards_per_month'] == -1:
        return True, None
    
    # Count flashcards created this month
    start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    flashcards_this_month = Flashcard.objects.filter(
        user=user,
        created_at__gte=start_of_month
    ).count()
    
    remaining = limits['flashcards_per_month'] - flashcards_this_month
    if remaining > 0:
        return True, remaining
    return False, 0


def check_file_size_limit(user, file_size_bytes):
    """Check if file size is within plan limit"""
    limits = user.get_plan_limits()
    max_size_bytes = limits['max_file_size_mb'] * 1024 * 1024  # Convert MB to bytes
    return file_size_bytes <= max_size_bytes


def check_ai_generation_limit(user):
    """Check if user can make more AI generations this month"""
    limits = user.get_plan_limits()
    if limits['ai_generations_per_month'] == -1:
        return True, None
    
    # Count AI generations (summaries + flashcard generations) this month
    start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    summaries_count = Summary.objects.filter(
        user=user,
        created_at__gte=start_of_month
    ).count()
    
    # Count flashcard generations (flashcards created from AI, not manually)
    ai_flashcards_count = Flashcard.objects.filter(
        user=user,
        created_at__gte=start_of_month,
        document__isnull=False  # AI-generated flashcards have a document
    ).count()
    
    total_generations = summaries_count + ai_flashcards_count
    remaining = limits['ai_generations_per_month'] - total_generations
    if remaining > 0:
        return True, remaining
    return False, 0

