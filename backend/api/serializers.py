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
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'date_joined',
            'is_staff', 'is_superuser'
        )


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

