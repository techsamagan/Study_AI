from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Limits login and registration attempts per IP address."""
    scope = 'auth'


class AIRateThrottle(UserRateThrottle):
    """Limits OpenAI-backed requests per user to keep API costs bounded."""
    scope = 'ai'
