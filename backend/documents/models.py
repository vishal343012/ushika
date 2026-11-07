from django.db import models

class Document(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/%Y/%m/")
    document_type = models.CharField(max_length=80, default="Bank statement")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    extracted_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_name} ({self.status})"
