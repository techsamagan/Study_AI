import logging

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .extraction import MIME_TYPES, extract_text, get_extension
from .models import Document, Summary, Flashcard, StudySession
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    DocumentSerializer,
    SummarySerializer,
    FlashcardSerializer,
    FlashcardCreateSerializer,
    FlashcardReviewSerializer,
    StudySessionSerializer,
)
from .services import AIServiceError, AIServiceNotConfigured, OpenAIService
from .throttles import AIRateThrottle, AuthRateThrottle

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login view that returns the user alongside the token pair"""

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update current user profile"""
    if request.method == "GET":
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _parse_num_cards(value):
    try:
        num_cards = int(value)
    except (ValueError, TypeError):
        return 10
    return num_cards if 1 <= num_cards <= 50 else 10


def _ai_error_response(exc, what):
    """Turn an AI failure into a response without leaking internal details."""
    if isinstance(exc, AIServiceNotConfigured):
        return Response(
            {"error": "The AI service is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(
        {"error": f"The AI service could not generate {what}. Please try again."},
        status=status.HTTP_502_BAD_GATEWAY,
    )


def _create_flashcards(cards_data, **owner_fields):
    return Flashcard.objects.bulk_create(
        [
            Flashcard(
                question=card["question"],
                answer=card["answer"],
                category=card["category"],
                **owner_fields,
            )
            for card in cards_data
        ]
    )


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document management"""

    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scoping by user is what enforces ownership for every action below.
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        file = serializer.validated_data["file"]
        extension = get_extension(file.name)

        try:
            text, pages = extract_text(file, extension)
        except ValueError as exc:
            raise serializers.ValidationError({"file": [str(exc)]})

        serializer.save(
            user=self.request.user,
            file_size=file.size,
            file_type=MIME_TYPES[extension],
            pages=pages,
            extracted_text=text,
        )

    def _get_document_text(self, document):
        """Return the document text, extracting it once for older documents."""
        if document.extracted_text:
            return document.extracted_text

        extension = get_extension(document.file.name)
        try:
            with document.file.open("rb") as file:
                text, _ = extract_text(file, extension)
        except (ValueError, OSError) as exc:
            logger.warning("Could not read file for document %s: %s", document.pk, exc)
            return ""

        if text:
            document.extracted_text = text
            document.save(update_fields=["extracted_text"])
        return text

    @action(detail=True, methods=["post"], throttle_classes=[AIRateThrottle])
    def generate_summary(self, request, pk=None):
        """Generate (or regenerate) the summary for a document"""
        document = self.get_object()

        text_content = self._get_document_text(document)
        if not text_content:
            return Response(
                {"error": "Could not extract text from document"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            summary_data = OpenAIService().generate_summary(text_content)
        except AIServiceError as exc:
            return _ai_error_response(exc, "a summary")

        # Regenerating updates the existing summary in place, so flashcards
        # that were created from it stay linked.
        summary = document.summaries.first()
        created = summary is None
        if created:
            summary = Summary(user=request.user, document=document)
        summary.full_summary = summary_data["full_summary"]
        summary.key_points = summary_data["key_points"]
        summary.save()

        return Response(
            SummarySerializer(summary, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], throttle_classes=[AIRateThrottle])
    def generate_flashcards(self, request, pk=None):
        """Generate flashcards from a document"""
        document = self.get_object()
        num_cards = _parse_num_cards(request.data.get("num_cards", 10))

        text_content = self._get_document_text(document)
        if not text_content:
            return Response(
                {"error": "Could not extract text from document"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            flashcards_data = OpenAIService().generate_flashcards(text_content, num_cards)
        except AIServiceError as exc:
            return _ai_error_response(exc, "flashcards")

        flashcards = _create_flashcards(flashcards_data, user=request.user, document=document)
        serializer = FlashcardSerializer(
            flashcards, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        """Delete all documents for current user"""
        documents = Document.objects.filter(user=request.user)
        count = documents.count()
        documents.delete()

        return Response(
            {
                "message": f"Successfully deleted {count} document(s)",
                "deleted_count": count,
            },
            status=status.HTTP_200_OK,
        )


class SummaryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for reading and deleting summaries (they are created by generate_summary)"""

    serializer_class = SummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Summary.objects.filter(user=self.request.user).select_related("document")

        # Filter by document if provided
        document_id = self.request.query_params.get("document")
        if document_id and document_id.isdigit():
            queryset = queryset.filter(document_id=document_id)

        return queryset

    @action(detail=True, methods=["post"], throttle_classes=[AIRateThrottle])
    def generate_flashcards(self, request, pk=None):
        """Generate flashcards from a summary"""
        summary = self.get_object()
        num_cards = _parse_num_cards(request.data.get("num_cards", 10))

        try:
            flashcards_data = OpenAIService().generate_flashcards(summary.full_summary, num_cards)
        except AIServiceError as exc:
            return _ai_error_response(exc, "flashcards")

        flashcards = _create_flashcards(
            flashcards_data,
            user=request.user,
            document=summary.document,
            summary=summary,
        )
        serializer = FlashcardSerializer(
            flashcards, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FlashcardViewSet(viewsets.ModelViewSet):
    """ViewSet for flashcard management"""

    serializer_class = FlashcardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Flashcard.objects.filter(user=self.request.user).select_related("document")

        # Filter by category if provided
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(category=category)

        # Filter by document if provided
        document_id = self.request.query_params.get("document", None)
        if document_id and document_id.isdigit():
            queryset = queryset.filter(document_id=document_id)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = FlashcardCreateSerializer(
            data=request.data, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        flashcard = serializer.save(user=request.user)
        # Respond with the full card (including its id) so clients can edit it right away.
        return Response(
            FlashcardSerializer(flashcard, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        """Record a study review and step the card's mastery level up or down"""
        flashcard = self.get_object()

        serializer = FlashcardReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["result"] == "mastered":
            mastery_level = flashcard.mastery_level + Flashcard.MASTERY_GAIN
        else:
            mastery_level = flashcard.mastery_level - Flashcard.MASTERY_LOSS

        flashcard.mastery_level = max(0, min(100, mastery_level))
        flashcard.last_reviewed = timezone.now()
        flashcard.review_count += 1
        flashcard.save(update_fields=["mastery_level", "last_reviewed", "review_count", "updated_at"])

        return Response(self.get_serializer(flashcard).data)

    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        """Delete all flashcards for current user"""
        flashcards = Flashcard.objects.filter(user=request.user)
        count = flashcards.count()
        flashcards.delete()

        return Response(
            {
                "message": f"Successfully deleted {count} flashcard(s)",
                "deleted_count": count,
            },
            status=status.HTTP_200_OK,
        )


class StudySessionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for recording completed study sessions"""

    serializer_class = StudySessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def _format_study_time(total_seconds):
    hours, remainder = divmod(int(total_seconds), 3600)
    minutes = remainder // 60
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user

    mastery_value = (
        Flashcard.objects.filter(user=user).aggregate(avg_mastery=Avg("mastery_level"))["avg_mastery"]
        or 0
    )
    study_seconds = (
        StudySession.objects.filter(user=user).aggregate(total=Sum("duration_seconds"))["total"]
        or 0
    )

    stats = {
        "documents_count": Document.objects.filter(user=user).count(),
        "flashcards_count": Flashcard.objects.filter(user=user).count(),
        "summaries_count": Summary.objects.filter(user=user).count(),
        "study_seconds": study_seconds,
        "study_time": _format_study_time(study_seconds),
        "mastery": int(mastery_value),
    }

    return Response(stats)
