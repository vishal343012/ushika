from pathlib import Path
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import Document
from .serializers import DocumentSerializer
from .tasks import process_document

@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "service": "ushika-backend"})

@csrf_exempt
@api_view(["POST"])
def demo_login(request):
    # DEMO ONLY: replace with proper authentication before any shared/production use.
    email = request.data.get("email")
    password = request.data.get("password")
    if email == "demo@ushika.local" and password == "Demo@123":
        return Response({"ok": True, "user": {"name": "Demo Customer", "email": email}})
    return Response({"ok": False, "detail": "Invalid demo credentials"}, status=401)

@api_view(["GET"])
def document_list(request):
    docs = Document.objects.all()[:100]
    return Response(DocumentSerializer(docs, many=True).data)

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def document_upload(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response({"detail": "Select a file to upload."}, status=400)
    if uploaded.size > 10 * 1024 * 1024:
        return Response({"detail": "Maximum demo upload size is 10 MB."}, status=400)
    allowed = {".pdf", ".png", ".jpg", ".jpeg"}
    if Path(uploaded.name).suffix.lower() not in allowed:
        return Response({"detail": "Only PDF, PNG and JPG files are allowed."}, status=400)

    doc = Document.objects.create(
        original_name=uploaded.name,
        file=uploaded,
        document_type=request.data.get("document_type", "Bank statement"),
    )
    try:
        process_document.delay(doc.id)
    except Exception as exc:
        doc.status = "FAILED"
        doc.error_message = f"Could not queue task: {exc}"[:1000]
        doc.save(update_fields=["status", "error_message", "updated_at"])
        return Response(DocumentSerializer(doc).data, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response(DocumentSerializer(doc).data, status=201)

@api_view(["GET"])
def document_detail(request, pk):
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"detail": "Document not found."}, status=404)
    return Response(DocumentSerializer(doc).data)
