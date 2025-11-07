from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Document, Summary, Flashcard

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    is_pro = serializers.BooleanField(read_only=True)
    plan_limits = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'date_joined', 
                  'plan_type', 'subscription_status', 'is_pro', 'plan_limits',
                  'is_staff', 'is_superuser')
    
    def get_plan_limits(self, obj):
        """Get plan limits for the user"""
        limits = obj.get_plan_limits()
        # Get current usage
        from django.utils import timezone
        from datetime import datetime
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        from .models import Document, Summary, Flashcard
        documents_count = Document.objects.filter(user=obj, uploaded_at__gte=start_of_month).count()
        summaries_count = Summary.objects.filter(user=obj, created_at__gte=start_of_month).count()
        flashcards_count = Flashcard.objects.filter(user=obj, created_at__gte=start_of_month).count()
        
        return {
            'documents': {
                'limit': limits['documents_per_month'],
                'used': documents_count,
                'remaining': limits['documents_per_month'] - documents_count if limits['documents_per_month'] != -1 else -1
            },
            'summaries': {
                'limit': limits['summaries_per_month'],
                'used': summaries_count,
                'remaining': limits['summaries_per_month'] - summaries_count if limits['summaries_per_month'] != -1 else -1
            },
            'flashcards': {
                'limit': limits['flashcards_per_month'],
                'used': flashcards_count,
                'remaining': limits['flashcards_per_month'] - flashcards_count if limits['flashcards_per_month'] != -1 else -1
            },
            'max_file_size_mb': limits['max_file_size_mb'],
            'ai_generations': {
                'limit': limits['ai_generations_per_month'],
                'used': summaries_count + Flashcard.objects.filter(user=obj, created_at__gte=start_of_month, document__isnull=False).count(),
                'remaining': limits['ai_generations_per_month'] - (summaries_count + Flashcard.objects.filter(user=obj, created_at__gte=start_of_month, document__isnull=False).count()) if limits['ai_generations_per_month'] != -1 else -1
            }
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer with user data"""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        return token


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Document
        fields = ('id', 'user', 'title', 'file', 'file_size', 'file_type', 'pages', 'uploaded_at', 'updated_at')
        read_only_fields = ('user', 'file_size', 'file_type', 'uploaded_at', 'updated_at')


class SummarySerializer(serializers.ModelSerializer):
    """Serializer for summaries"""
    user = UserSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = Summary
        fields = ('id', 'user', 'document', 'full_summary', 'key_points', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')


class FlashcardSerializer(serializers.ModelSerializer):
    """Serializer for flashcards"""
    user = UserSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = Flashcard
        fields = (
            'id', 'user', 'document', 'summary', 'question', 'answer', 'category',
            'created_at', 'updated_at', 'last_reviewed', 'review_count', 'mastery_level'
        )
        read_only_fields = ('user', 'created_at', 'updated_at')


class FlashcardCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating flashcards"""
    class Meta:
        model = Flashcard
        fields = ('question', 'answer', 'category', 'document', 'summary')

