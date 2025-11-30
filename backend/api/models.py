from django.db import models
from django.contrib.auth.models import AbstractUser
class User(AbstractUser):
    """Custom user model"""
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
    
class Document(models.Model):
    """Document model for uploaded files"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    file_size = models.IntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=255, help_text="File MIME type")
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

