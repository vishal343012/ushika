from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id", "original_name", "document_type", "status",
            "extracted_data", "error_message", "created_at", "updated_at"
        ]
