import json
import logging

from django.conf import settings
from openai import OpenAI, OpenAIError

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """The AI provider failed or returned something unusable."""


class AIServiceNotConfigured(AIServiceError):
    """OPENAI_API_KEY is missing."""


class OpenAIService:
    """Service for interacting with OpenAI API"""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            raise AIServiceNotConfigured("OPENAI_API_KEY not set in environment variables")
        self.client = OpenAI(
            api_key=self.api_key,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_retries=1,
        )

    def _complete_json(self, system_prompt: str, user_prompt: str, max_tokens: int) -> dict:
        """Run a chat completion in JSON mode and return the parsed object."""
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=max_tokens,
            )
        except OpenAIError as exc:
            logger.exception("OpenAI request failed")
            raise AIServiceError("The AI service request failed") from exc

        content = response.choices[0].message.content or ""
        try:
            result = json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error("OpenAI returned invalid JSON: %.200s", content)
            raise AIServiceError("The AI service returned an unreadable response") from exc
        if not isinstance(result, dict):
            raise AIServiceError("The AI service returned an unexpected response")
        return result

    @staticmethod
    def _truncate(text_content: str) -> str:
        """Keep prompts inside the model's context window and bound the cost."""
        return text_content[:settings.AI_MAX_INPUT_CHARS]

    def generate_summary(self, text_content: str) -> dict:
        """
        Generate a summary and key points from text content

        Returns:
            dict with 'full_summary' and 'key_points' keys
        """
        result = self._complete_json(
            "You are an expert at summarizing educational content. "
            "Create comprehensive summaries and extract key points. "
            "Always respond with a JSON object.",
            f"""Please provide a comprehensive summary of the following content and extract key points.

Content:
{self._truncate(text_content)}

Respond with a JSON object in exactly this shape:
{{
    "full_summary": "a detailed summary of 3-5 paragraphs, separated by blank lines",
    "key_points": ["point 1", "point 2", "5 to 10 points in total"]
}}""",
            max_tokens=2000,
        )

        full_summary = result.get("full_summary")
        if not isinstance(full_summary, str) or not full_summary.strip():
            raise AIServiceError("The AI service returned a summary in an unexpected format")

        key_points = result.get("key_points")
        if not isinstance(key_points, list):
            key_points = []
        return {
            "full_summary": full_summary.strip(),
            "key_points": [str(point).strip() for point in key_points if str(point).strip()],
        }

    def generate_flashcards(self, text_content: str, num_cards: int = 10) -> list:
        """
        Generate flashcards from text content

        Args:
            text_content: The text to generate flashcards from
            num_cards: Number of flashcards to generate (default: 10)

        Returns:
            List of dictionaries with 'question', 'answer' and 'category' keys
        """
        result = self._complete_json(
            "You are an expert at creating educational flashcards. "
            "Create clear, concise questions and comprehensive answers. "
            "Always respond with a JSON object.",
            f"""Generate {num_cards} flashcards from the following content. Each flashcard should have a clear question and a detailed answer.

Content:
{self._truncate(text_content)}

Respond with a JSON object in exactly this shape:
{{
    "flashcards": [
        {{
            "question": "What is...?",
            "answer": "Detailed answer here...",
            "category": "Category name"
        }}
    ]
}}

Make sure the questions cover the most important concepts and the answers are comprehensive but concise.""",
            max_tokens=4000,
        )

        raw_cards = result.get("flashcards")
        if not isinstance(raw_cards, list):
            raise AIServiceError("The AI service returned flashcards in an unexpected format")

        flashcards = []
        for card in raw_cards:
            if not isinstance(card, dict):
                continue
            question = str(card.get("question") or "").strip()
            answer = str(card.get("answer") or "").strip()
            if not question or not answer:
                continue
            flashcards.append({
                "question": question,
                "answer": answer,
                "category": (str(card.get("category") or "").strip() or "General")[:100],
            })

        if not flashcards:
            raise AIServiceError("The AI service did not return any usable flashcards")
        return flashcards[:num_cards]  # Limit to requested number
