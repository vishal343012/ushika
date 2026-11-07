import time
from celery import shared_task
from .models import Document

@shared_task(bind=True, max_retries=2, default_retry_delay=5)
def process_document(self, document_id):
    try:
        doc = Document.objects.get(pk=document_id)
        doc.status = "PROCESSING"
        doc.error_message = ""
        doc.save(update_fields=["status", "error_message", "updated_at"])

        # DEMO ONLY: simulate document processing. No OCR or real financial validation.
        time.sleep(8)
        doc.extracted_data = {
            "document_reference": f"USH-DEMO-{doc.id:05d}",
            "document_type": doc.document_type,
            "customer_name": "Sample Customer",
            "account_number": "XXXX-XXXX-1234",
            "statement_period": "01-Oct-2026 to 31-Oct-2026",
            "processing_note": "Demonstration data only; not extracted from the uploaded file."
        }
        doc.status = "COMPLETED"
        doc.save(update_fields=["extracted_data", "status", "updated_at"])
        return {"document_id": doc.id, "status": doc.status}
    except Document.DoesNotExist:
        return {"document_id": document_id, "status": "NOT_FOUND"}
    except Exception as exc:
        try:
            doc = Document.objects.get(pk=document_id)
            doc.status = "FAILED"
            doc.error_message = str(exc)[:1000]
            doc.save(update_fields=["status", "error_message", "updated_at"])
        except Exception:
            pass
        raise self.retry(exc=exc)
