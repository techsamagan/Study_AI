from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Document


@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    """Remove the uploaded file from storage when its Document row is deleted."""
    if instance.file:
        instance.file.delete(save=False)
