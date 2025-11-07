from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """Custom user model"""
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
    ]
    
    email = models.EmailField(unique=True)
    plan_type = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')
    subscription_status = models.CharField(max_length=20, default='active')  # active, cancelled, expired
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
    
    @property
    def is_pro(self):
        """Check if user has active pro subscription"""
        if self.plan_type == 'pro' and self.subscription_status == 'active':
            if self.subscription_end_date:
                return timezone.now() < self.subscription_end_date
            return True
        return False
    
    def get_plan_limits(self):
        """Get limits based on user's plan"""
        if self.is_pro:
            return {
                'documents_per_month': -1,  # Unlimited
                'summaries_per_month': -1,  # Unlimited
                'flashcards_per_month': -1,  # Unlimited
                'max_file_size_mb': 50,  # 50MB for pro
                'ai_generations_per_month': -1,  # Unlimited
            }
        else:
            return {
                'documents_per_month': 10,
                'summaries_per_month': 10,
                'flashcards_per_month': 50,
                'max_file_size_mb': 10,  # 10MB for free
                'ai_generations_per_month': 20,
            }


class Document(models.Model):
    """Document model for uploaded files"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    file_size = models.IntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=50, help_text="File MIME type")
    pages = models.IntegerField(null=True, blank=True, help_text="Number of pages if applicable")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title


class Summary(models.Model):
    """Summary model for document summaries"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='summaries')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='summaries')
    full_summary = models.TextField()
    key_points = models.JSONField(default=list, help_text="List of key points")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Summaries'

    def __str__(self):
        return f"Summary for {self.document.title}"


class Flashcard(models.Model):
    """Flashcard model for study cards"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='flashcards', null=True, blank=True)
    summary = models.ForeignKey(Summary, on_delete=models.CASCADE, related_name='flashcards', null=True, blank=True)
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100, default='General')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Study tracking fields
    last_reviewed = models.DateTimeField(null=True, blank=True)
    review_count = models.IntegerField(default=0)
    mastery_level = models.IntegerField(default=0, help_text="0-100 mastery level")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.question[:50]}..."

