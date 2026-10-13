import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .extraction import get_extension
from .models import Document, Summary, Flashcard, StudySession

User = get_user_model()


def generate_unique_username(email):
    """Build a username from the email's local part, adding a suffix on collision."""
    base = re.sub(r'[^\w.@+-]', '', email.split('@')[0])[:140] or 'user'
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f'{base}{suffix}'
    return username


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        candidate = User(
            email=attrs.get('email', ''),
            username=attrs.get('username', ''),
            first_name=attrs.get('first_name', ''),
            last_name=attrs.get('last_name', ''),
        )
        try:
            validate_password(attrs['password'], user=candidate)
        except Exception as exc:
            raise serializers.ValidationError({'password': list(getattr(exc, 'messages', [str(exc)]))})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        if not validated_data.get('username'):
            validated_data['username'] = generate_unique_username(validated_data['email'])
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for a user reading or editing their own profile"""

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'date_joined',
            'is_staff', 'is_superuser'
        )
        # Permission flags must never be editable through the profile endpoint.
        read_only_fields = ('id', 'date_joined', 'is_staff', 'is_superuser')


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for the admin user-management endpoints"""

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'date_joined',
            'is_active', 'is_staff', 'is_superuser'
        )
        read_only_fields = ('id', 'date_joined', 'is_superuser')

    def validate(self, attrs):
        request = self.context.get('request')
        changes_access = 'is_staff' in attrs or 'is_active' in attrs
        if changes_access and not (request and request.user.is_superuser):
            raise serializers.ValidationError(
                'Only superusers can change admin access or deactivate accounts.'
            )
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer with user data"""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents"""

    class Meta:
        model = Document
        fields = ('id', 'title', 'file', 'file_size', 'file_type', 'pages', 'uploaded_at', 'updated_at')
        read_only_fields = ('file_size', 'file_type', 'pages', 'uploaded_at', 'updated_at')
        # Uploaded files are private: the API never hands out their storage URL.
        extra_kwargs = {'file': {'write_only': True}}

    def validate_file(self, file):
        if file.size > settings.MAX_UPLOAD_SIZE:
            limit_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
            raise serializers.ValidationError(f'File size exceeds the {limit_mb}MB limit.')
        if get_extension(file.name) not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise serializers.ValidationError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
        return file

    def update(self, instance, validated_data):
        # The stored file is immutable; only metadata such as the title can change.
        validated_data.pop('file', None)
        return super().update(instance, validated_data)


class SummarySerializer(serializers.ModelSerializer):
    """Serializer for summaries"""
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = Summary
        fields = ('id', 'document', 'full_summary', 'key_points', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class FlashcardSerializer(serializers.ModelSerializer):
    """Serializer for reading and editing flashcards"""
    document = DocumentSerializer(read_only=True)

    class Meta:
        model = Flashcard
        fields = (
            'id', 'document', 'summary', 'question', 'answer', 'category',
            'created_at', 'updated_at', 'last_reviewed', 'review_count', 'mastery_level'
        )
        # Study progress only changes through the review endpoint.
        read_only_fields = (
            'summary', 'created_at', 'updated_at',
            'last_reviewed', 'review_count', 'mastery_level'
        )


class FlashcardCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating flashcards"""
    class Meta:
        model = Flashcard
        fields = ('question', 'answer', 'category', 'document', 'summary')

    def get_fields(self):
        fields = super().get_fields()
        # A card may only be linked to the requesting user's own records.
        request = self.context.get('request')
        if request is not None:
            fields['document'].queryset = Document.objects.filter(user=request.user)
            fields['summary'].queryset = Summary.objects.filter(user=request.user)
        return fields


class FlashcardReviewSerializer(serializers.Serializer):
    """Input for the flashcard review endpoint"""
    result = serializers.ChoiceField(choices=('mastered', 'needs_practice'))


class StudySessionSerializer(serializers.ModelSerializer):
    """Serializer for study sessions"""
    duration_seconds = serializers.IntegerField(min_value=0, max_value=24 * 60 * 60)

    class Meta:
        model = StudySession
        fields = ('id', 'duration_seconds', 'cards_reviewed', 'cards_mastered', 'created_at')
        read_only_fields = ('created_at',)
