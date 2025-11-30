import openai
from openai import OpenAI
from django.conf import settings
import json
import re


class OpenAIService:
    """Service for interacting with OpenAI API"""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not set in environment variables")
        self.client = OpenAI(api_key=self.api_key)

    def generate_summary(self, text_content: str) -> dict:
        """
        Generate a summary and key points from text content
        
        Returns:
            dict with 'full_summary' and 'key_points' keys
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at summarizing educational content. Create comprehensive summaries and extract key points."
                    },
                    {
                        "role": "user",
                        "content": f"""Please provide a comprehensive summary of the following content and extract key points.

Content:
{text_content}

Please provide:
1. A detailed summary (3-5 paragraphs)
2. A list of 5-10 key points (as a JSON array)

Format your response as JSON:
{{
    "full_summary": "detailed summary text here",
    "key_points": ["point 1", "point 2", "point 3", ...]
}}"""
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )

            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                # Extract JSON from markdown code blocks if present
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    result = json.loads(content)
            except json.JSONDecodeError:
                # Fallback: create structure from text
                lines = content.split('\n')
                summary_lines = []
                key_points = []
                in_key_points = False
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if 'key point' in line.lower() or 'key points' in line.lower():
                        in_key_points = True
                        continue
                    if in_key_points and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                        key_points.append(line.lstrip('- •0123456789. '))
                    else:
                        summary_lines.append(line)
                
                result = {
                    'full_summary': '\n\n'.join(summary_lines) if summary_lines else content,
                    'key_points': key_points if key_points else [content[:100] + "..."]
                }

            return result

        except Exception as e:
            raise Exception(f"Error generating summary: {str(e)}")

    def generate_flashcards(self, text_content: str, num_cards: int = 10) -> list:
        """
        Generate flashcards from text content
        
        Args:
            text_content: The text to generate flashcards from
            num_cards: Number of flashcards to generate (default: 10)
        
        Returns:
            List of dictionaries with 'question' and 'answer' keys
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at creating educational flashcards. Create clear, concise questions and comprehensive answers."
                    },
                    {
                        "role": "user",
                        "content": f"""Generate {num_cards} flashcards from the following content. Each flashcard should have a clear question and a detailed answer.

Content:
{text_content}

Please provide the flashcards as a JSON array:
[
    {{
        "question": "What is...?",
        "answer": "Detailed answer here...",
        "category": "Category name"
    }},
    ...
]

Make sure the questions cover the most important concepts and the answers are comprehensive but concise."""
                    }
                ],
                temperature=0.7,
                max_tokens=3000
            )

            content = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                # Extract JSON array from markdown code blocks if present
                json_match = re.search(r'\[.*\]', content, re.DOTALL)
                if json_match:
                    flashcards = json.loads(json_match.group())
                else:
                    flashcards = json.loads(content)
            except json.JSONDecodeError:
                # Fallback: parse text format
                flashcards = []
                lines = content.split('\n')
                current_card = {}
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        if current_card:
                            flashcards.append(current_card)
                            current_card = {}
                        continue
                    
                    if line.lower().startswith('question'):
                        current_card['question'] = line.split(':', 1)[1].strip() if ':' in line else line
                    elif line.lower().startswith('answer'):
                        current_card['answer'] = line.split(':', 1)[1].strip() if ':' in line else line
                    elif line.lower().startswith('category'):
                        current_card['category'] = line.split(':', 1)[1].strip() if ':' in line else 'General'
                    elif 'question' not in current_card:
                        current_card['question'] = line
                    elif 'answer' not in current_card:
                        current_card['answer'] = line
                    else:
                        current_card['answer'] += ' ' + line
                
                if current_card:
                    flashcards.append(current_card)

            # Ensure all flashcards have required fields
            for card in flashcards:
                if 'question' not in card or not card['question']:
                    card['question'] = "Question not generated"
                if 'answer' not in card or not card['answer']:
                    card['answer'] = "Answer not generated"
                if 'category' not in card:
                    card['category'] = 'General'

            return flashcards[:num_cards]  # Limit to requested number

        except Exception as e:
            raise Exception(f"Error generating flashcards: {str(e)}")

