from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg
from django.utils import timezone
from django.core.files.storage import default_storage
import PyPDF2
import docx
import os

from .models import Document, Summary, Flashcard
from .serializers import (
    UserRegistrationSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    DocumentSerializer, SummarySerializer, FlashcardSerializer, FlashcardCreateSerializer
)
from .services import OpenAIService
from .plan_limits import (
    check_document_limit, check_summary_limit, check_flashcard_limit,
    check_file_size_limit, check_ai_generation_limit
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that returns user data"""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            response.data['user'] = UserSerializer(user).data
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update current user profile"""
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document management"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        if not file:
            raise ValueError("No file provided")
        
        # Calculate file size
        file_size = file.size
        
        # Check file size limit
        if not check_file_size_limit(self.request.user, file_size):
            limits = self.request.user.get_plan_limits()
            raise ValueError(f"File size exceeds your plan limit of {limits['max_file_size_mb']}MB. Upgrade to Pro for larger files.")
        
        # Check document upload limit
        can_upload, remaining = check_document_limit(self.request.user)
        if not can_upload:
            raise ValueError(f"You've reached your monthly document upload limit. Upgrade to Pro for unlimited uploads.")
        
        # Determine file type
        file_type = file.content_type or 'application/octet-stream'
        
        # Try to extract text and count pages
        pages = None
        try:
            if file_type == 'application/pdf':
                pdf_reader = PyPDF2.PdfReader(file)
                pages = len(pdf_reader.pages)
            elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
                doc = docx.Document(file)
                # Estimate pages (rough calculation)
                pages = max(1, len(doc.paragraphs) // 20)
        except Exception:
            pass  # If extraction fails, pages remains None
        
        serializer.save(
            user=self.request.user,
            file_size=file_size,
            file_type=file_type,
            pages=pages
        )

    @action(detail=True, methods=['post'])
    def generate_summary(self, request, pk=None):
        """Generate summary for a document"""
        document = self.get_object()
        
        if document.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check AI generation limit
        can_generate, remaining = check_ai_generation_limit(request.user)
        if not can_generate:
            return Response(
                {'error': f'You\'ve reached your monthly AI generation limit. Upgrade to Pro for unlimited AI generations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check summary limit
        can_create, remaining_summaries = check_summary_limit(request.user)
        if not can_create:
            return Response(
                {'error': f'You\'ve reached your monthly summary limit. Upgrade to Pro for unlimited summaries.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Extract text from document
            text_content = self._extract_text_from_document(document)
            
            if not text_content:
                return Response(
                    {'error': 'Could not extract text from document'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate summary using OpenAI
            openai_service = OpenAIService()
            summary_data = openai_service.generate_summary(text_content)

            # Create summary object
            summary = Summary.objects.create(
                user=request.user,
                document=document,
                full_summary=summary_data['full_summary'],
                key_points=summary_data.get('key_points', [])
            )

            serializer = SummarySerializer(summary)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def generate_flashcards(self, request, pk=None):
        """Generate flashcards from a document"""
        document = self.get_object()
        
        if document.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check AI generation limit
        can_generate, remaining = check_ai_generation_limit(request.user)
        if not can_generate:
            return Response(
                {'error': f'You\'ve reached your monthly AI generation limit. Upgrade to Pro for unlimited AI generations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check flashcard limit
        can_create, remaining_flashcards = check_flashcard_limit(request.user)
        if not can_create:
            return Response(
                {'error': f'You\'ve reached your monthly flashcard limit. Upgrade to Pro for unlimited flashcards.'},
                status=status.HTTP_403_FORBIDDEN
            )

        num_cards = request.data.get('num_cards', 10)
        try:
            num_cards = int(num_cards)
            if num_cards < 1 or num_cards > 50:
                num_cards = 10
        except (ValueError, TypeError):
            num_cards = 10

        try:
            # Extract text from document
            text_content = self._extract_text_from_document(document)
            
            if not text_content:
                return Response(
                    {'error': 'Could not extract text from document'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate flashcards using OpenAI
            openai_service = OpenAIService()
            flashcards_data = openai_service.generate_flashcards(text_content, num_cards)

            # Create flashcard objects
            created_flashcards = []
            for card_data in flashcards_data:
                flashcard = Flashcard.objects.create(
                    user=request.user,
                    document=document,
                    question=card_data['question'],
                    answer=card_data['answer'],
                    category=card_data.get('category', 'General')
                )
                created_flashcards.append(flashcard)

            serializer = FlashcardSerializer(created_flashcards, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _extract_text_from_document(self, document):
        """Extract text content from document file"""
        try:
            file_path = document.file.path
            file_type = document.file_type

            if file_type == 'application/pdf':
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ''
                    for page in pdf_reader.pages:
                        text += page.extract_text() + '\n'
                    return text

            elif file_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
                doc = docx.Document(file_path)
                text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
                return text

            elif file_type == 'text/plain':
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()

            else:
                # Try to read as text anyway
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        return file.read()
                except:
                    return None

        except Exception as e:
            print(f"Error extracting text: {str(e)}")
            return None


class SummaryViewSet(viewsets.ModelViewSet):
    """ViewSet for summary management"""
    serializer_class = SummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Summary.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_flashcards(self, request, pk=None):
        """Generate flashcards from a summary"""
        summary = self.get_object()
        
        if summary.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check AI generation limit
        can_generate, remaining = check_ai_generation_limit(request.user)
        if not can_generate:
            return Response(
                {'error': f'You\'ve reached your monthly AI generation limit. Upgrade to Pro for unlimited AI generations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check flashcard limit
        can_create, remaining_flashcards = check_flashcard_limit(request.user)
        if not can_create:
            return Response(
                {'error': f'You\'ve reached your monthly flashcard limit. Upgrade to Pro for unlimited flashcards.'},
                status=status.HTTP_403_FORBIDDEN
            )

        num_cards = request.data.get('num_cards', 10)
        try:
            num_cards = int(num_cards)
            if num_cards < 1 or num_cards > 50:
                num_cards = 10
        except (ValueError, TypeError):
            num_cards = 10

        try:
            # Use summary content to generate flashcards
            text_content = summary.full_summary
            
            # Generate flashcards using OpenAI
            openai_service = OpenAIService()
            flashcards_data = openai_service.generate_flashcards(text_content, num_cards)

            # Create flashcard objects
            created_flashcards = []
            for card_data in flashcards_data:
                flashcard = Flashcard.objects.create(
                    user=request.user,
                    document=summary.document,
                    summary=summary,
                    question=card_data['question'],
                    answer=card_data['answer'],
                    category=card_data.get('category', 'General')
                )
                created_flashcards.append(flashcard)

            serializer = FlashcardSerializer(created_flashcards, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FlashcardViewSet(viewsets.ModelViewSet):
    """ViewSet for flashcard management"""
    serializer_class = FlashcardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Flashcard.objects.filter(user=self.request.user)
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by document if provided
        document_id = self.request.query_params.get('document', None)
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return FlashcardCreateSerializer
        return FlashcardSerializer

    def perform_create(self, serializer):
        # Check flashcard limit for manual creation
        can_create, remaining = check_flashcard_limit(self.request.user)
        if not can_create:
            raise ValueError(f'You\'ve reached your monthly flashcard limit. Upgrade to Pro for unlimited flashcards.')
        
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Mark flashcard as reviewed"""
        flashcard = self.get_object()
        
        if flashcard.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        mastery_level = request.data.get('mastery_level', flashcard.mastery_level)
        try:
            mastery_level = int(mastery_level)
            if mastery_level < 0:
                mastery_level = 0
            elif mastery_level > 100:
                mastery_level = 100
        except (ValueError, TypeError):
            mastery_level = flashcard.mastery_level

        flashcard.last_reviewed = timezone.now()
        flashcard.review_count += 1
        flashcard.mastery_level = mastery_level
        flashcard.save()

        serializer = self.get_serializer(flashcard)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user
    
    mastery_result = Flashcard.objects.filter(user=user).aggregate(
        avg_mastery=Avg('mastery_level')
    )
    # The key is 'avg_mastery' when using aggregate(avg_mastery=Avg(...))
    mastery_value = mastery_result.get('avg_mastery') or 0
    
    stats = {
        'documents_count': Document.objects.filter(user=user).count(),
        'flashcards_count': Flashcard.objects.filter(user=user).count(),
        'summaries_count': Summary.objects.filter(user=user).count(),
        'study_time': '0h',  # Can be implemented with study session tracking
        'mastery': int(mastery_value) if mastery_value else 0,
        'plan_type': user.plan_type,
        'is_pro': user.is_pro,
    }
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Create Stripe checkout session for Pro plan upgrade"""
    from django.conf import settings
    import stripe
    
    # Check if Stripe is configured
    if not settings.STRIPE_SECRET_KEY or not settings.PRO_PLAN_PRICE_ID:
        error_msg = (
            'Stripe payment is not configured. '
            'Please add STRIPE_SECRET_KEY and PRO_PLAN_PRICE_ID to your backend/.env file. '
            'See backend/STRIPE_SETUP.md for detailed setup instructions.'
        )
        return Response(
            {'error': error_msg},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    user = request.user
    
    # Check if user is already Pro
    if user.is_pro:
        return Response(
            {'error': 'You already have an active Pro subscription.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create or retrieve Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}".strip() or user.username,
                metadata={'user_id': user.id}
            )
            user.stripe_customer_id = customer.id
            user.save()
        else:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': settings.PRO_PLAN_PRICE_ID,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{settings.FRONTEND_URL}/settings?success=true&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.FRONTEND_URL}/settings?canceled=true',
            metadata={
                'user_id': user.id,
            },
        )
        
        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        import traceback
        print(f"Stripe Error: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import traceback
        print(f"Error creating checkout session: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify payment and upgrade user to Pro after successful payment"""
    from django.conf import settings
    import stripe
    
    if not settings.STRIPE_SECRET_KEY:
        return Response(
            {'error': 'Stripe is not configured.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    session_id = request.data.get('session_id')
    
    if not session_id:
        return Response(
            {'error': 'Session ID is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Retrieve the checkout session
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Verify the session belongs to the current user
        if session.metadata.get('user_id') != str(request.user.id):
            return Response(
                {'error': 'Invalid session.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if payment was successful
        if session.payment_status == 'paid':
            # Retrieve subscription
            subscription = stripe.Subscription.retrieve(session.subscription)
            
            # Upgrade user to Pro
            user = request.user
            user.plan_type = 'pro'
            user.subscription_status = 'active'
            user.stripe_subscription_id = subscription.id
            user.subscription_start_date = timezone.now()
            # Set end date based on subscription period
            if subscription.current_period_end:
                from datetime import datetime
                user.subscription_end_date = datetime.fromtimestamp(subscription.current_period_end)
            else:
                from datetime import timedelta
                user.subscription_end_date = timezone.now() + timedelta(days=30)
            user.save()
            
            serializer = UserSerializer(user)
            return Response({
                'message': 'Successfully upgraded to Pro plan!',
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Payment not completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except stripe.error.StripeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': 'An error occurred while verifying payment.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook doesn't use JWT
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    from django.conf import settings
    import stripe
    import json
    
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        return Response(
            {'error': 'Stripe webhook is not configured.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata'].get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                subscription = stripe.Subscription.retrieve(session['subscription'])
                
                user.plan_type = 'pro'
                user.subscription_status = 'active'
                user.stripe_subscription_id = subscription.id
                user.subscription_start_date = timezone.now()
                if subscription.current_period_end:
                    from datetime import datetime
                    user.subscription_end_date = datetime.fromtimestamp(subscription.current_period_end)
                user.save()
            except User.DoesNotExist:
                pass
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        try:
            user = User.objects.get(stripe_subscription_id=subscription['id'])
            user.plan_type = 'free'
            user.subscription_status = 'cancelled'
            user.stripe_subscription_id = None
            user.save()
        except User.DoesNotExist:
            pass
    
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        try:
            subscription = stripe.Subscription.retrieve(invoice['subscription'])
            user = User.objects.get(stripe_subscription_id=subscription.id)
            user.subscription_status = 'past_due'
            user.save()
        except (User.DoesNotExist, stripe.error.StripeError):
            pass
    
    return Response({'status': 'success'}, status=status.HTTP_200_OK)

