from django.urls import path
from documents.views import health, demo_login, document_list, document_upload, document_detail

urlpatterns = [
    path("api/health/", health),
    path("api/login/", demo_login),
    path("api/documents/", document_list),
    path("api/documents/upload/", document_upload),
    path("api/documents/<int:pk>/", document_detail),
]
