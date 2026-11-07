# USHIKA Banking Document Portal – Local Docker POC

A demonstration-only application showing a Next.js frontend, Django REST API,
Celery background worker, PostgreSQL database and Redis broker.

## Important limitations
- This is sample code, not the company's actual USHIKA application.
- Login is a hard-coded demo gate, not production authentication.
- Document extraction is simulated; no OCR, KYC, banking verification or AI is performed.
- Files are stored in a Docker named volume, not Azure Blob Storage.
- Redis is a temporary local Celery broker. The target architecture specifies Azure Storage Queues;
  compatibility and transport behaviour must be validated before replacing Redis.
- Do not upload real customer, financial, identity or other sensitive documents.
- Do not expose this POC to the public internet.

## Requirements
- Linux VM
- Docker Engine
- Docker Compose plugin

## Start
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Open:
- Frontend: http://YOUR_VM_IP:3000
- Backend health: http://YOUR_VM_IP:8000/api/health/

For access from another machine, allow TCP 3000 and 8000 only from your trusted IP in the VM firewall/security group.
For local-only testing, use http://localhost:3000.

## Demo login
- Email: demo@ushika.local
- Password: Demo@123

This is only a visual/demo login gate. It is not secure authentication.

## Test workflow
1. Sign in using the demo credentials.
2. Upload a PDF, PNG or JPG document (use a dummy/sample file).
3. The backend stores the file and creates a PostgreSQL record.
4. Django queues a Celery task through Redis.
5. The worker simulates extraction and updates the record.
6. Refresh the dashboard to see the status and sample extracted fields.

## Useful commands
```bash
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend
docker compose ps
docker compose down
```

Stop containers but keep database and uploaded files:
```bash
docker compose down
```

Delete containers AND all POC database/upload data:
```bash
docker compose down -v
```

## Troubleshooting
- If frontend cannot reach backend from a remote browser, NEXT_PUBLIC_API_URL must use a browser-reachable VM address, not the Docker service name `backend`.
- If ports are already occupied, change the host-side ports in docker-compose.yml.
- If a task stays pending, inspect `docker compose logs -f worker` and `docker compose logs -f redis`.
- The backend startup command runs Django migrations automatically.

## Next steps after the local POC
1. Replace demo login with approved authentication.
2. Implement real document parsing/OCR with developer-approved requirements.
3. Replace local file volume with Azure Blob Storage.
4. Validate Celery + Kombu Azure Storage Queues transport against the target requirement.
5. Move PostgreSQL to Azure Database for PostgreSQL.
6. Deploy containers to AKS, then introduce Helm, Terraform and GitHub Actions.
