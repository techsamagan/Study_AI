from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import User, Document, Summary, Flashcard


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'full_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "-"
    full_name.short_description = 'Full Name'


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user_link', 'file_type', 'file_size_display', 'pages', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['title', 'user__email', 'user__username']
    readonly_fields = ['uploaded_at', 'updated_at', 'file_size', 'file_type', 'pages']
    date_hierarchy = 'uploaded_at'
    
    def user_link(self, obj):
        url = reverse('admin:api_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'
    
    def file_size_display(self, obj):
        if obj.file_size:
            size_mb = obj.file_size / (1024 * 1024)
            return f"{size_mb:.2f} MB"
        return "-"
    file_size_display.short_description = 'File Size'


@admin.register(Summary)
class SummaryAdmin(admin.ModelAdmin):
    list_display = ['document_title', 'user_link', 'key_points_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['document__title', 'user__email', 'user__username', 'full_summary']
    readonly_fields = ['created_at', 'updated_at', 'key_points']
    date_hierarchy = 'created_at'
    
    def document_title(self, obj):
        return obj.document.title
    document_title.short_description = 'Document'
    
    def user_link(self, obj):
        url = reverse('admin:api_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'
    
    def key_points_count(self, obj):
        if obj.key_points:
            return len(obj.key_points)
        return 0
    key_points_count.short_description = 'Key Points'


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ['question_preview', 'user_link', 'category', 'mastery_level', 'review_count', 'created_at']
    list_filter = ['category', 'created_at', 'mastery_level']
    search_fields = ['question', 'answer', 'user__email', 'user__username', 'category']
    readonly_fields = ['created_at', 'updated_at', 'last_reviewed', 'review_count']
    date_hierarchy = 'created_at'
    
    def question_preview(self, obj):
        preview = obj.question[:50] + "..." if len(obj.question) > 50 else obj.question
        return preview
    question_preview.short_description = 'Question'
    
    def user_link(self, obj):
        url = reverse('admin:api_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'
