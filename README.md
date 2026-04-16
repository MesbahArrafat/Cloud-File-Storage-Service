# ☁️ Cloud File Storage Service

A production-ready cloud file storage SaaS application inspired by Google Drive. Built with **Django REST Framework** + **React + TypeScript**, featuring secure file management, shareable links, background processing with Celery, and advanced storage optimization.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 4.2, Django REST Framework, PostgreSQL |
| **Auth** | JWT (djangorestframework-simplejwt) |
| **Async** | Celery + Redis |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | TanStack Query v5 (React Query) |
| **Routing** | React Router v6 |
| **Containers** | Docker + Docker Compose |

---

## 🚀 Quick Start

### With Docker Compose (recommended)

```bash
# Clone the repo
git clone <repo-url>
cd Cloud-File-Storage-Service

# Start all services
docker compose up --build

# App available at:
#   Frontend: http://localhost:80
#   Backend API: http://localhost:8000
#   API Docs: http://localhost:8000/api/docs/
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit DB/Redis settings
python manage.py migrate
python manage.py runserver

# In a separate terminal:
celery -A config.celery worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # starts at http://localhost:5173
```

---

## 📁 Project Structure

```
Cloud-File-Storage-Service/
├── backend/                  # Django + DRF API
│   ├── config/               # Settings, URLs, Celery, WSGI
│   ├── apps/
│   │   ├── authentication/   # JWT auth, custom User model
│   │   ├── files/            # File model, upload, sharing, chunked upload
│   │   ├── folders/          # Nested folder system
│   │   └── activity/         # Activity log
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── api/              # Axios API client layer
│   │   ├── components/       # Reusable UI + feature components
│   │   ├── context/          # Auth context
│   │   ├── hooks/            # React Query hooks
│   │   ├── pages/            # Route-level pages
│   │   └── types/            # TypeScript type definitions
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml        # Full stack orchestration
```

---

## 🌐 API Endpoints

### Authentication — `/auth/`
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login (returns JWT) |
| POST | `/auth/logout/` | Logout (blacklist token) |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET/PATCH | `/auth/profile/` | Get/update profile |

### Files — `/files/`
| Method | Path | Description |
|---|---|---|
| GET | `/files/` | List files (`?search=`, `?folder=`, `?starred=true`) |
| POST | `/files/` | Upload file |
| GET | `/files/{id}/` | Get file details |
| PATCH | `/files/{id}/` | Rename / move / star |
| DELETE | `/files/{id}/` | Soft delete (trash) |
| POST | `/files/{id}/restore/` | Restore from trash |
| DELETE | `/files/{id}/permanent/` | Permanent delete |
| GET | `/files/{id}/download/` | Download file |
| GET | `/files/{id}/preview/` | Preview (images/PDF) |
| GET | `/files/trash/` | List trashed files |
| GET | `/files/starred/` | List starred files |
| POST | `/files/zip-download/` | Download multiple as ZIP |

### Folders — `/folders/`
Full CRUD. Nested via `parent` field.

### Sharing — `/share/`
| Method | Path | Description |
|---|---|---|
| POST | `/share/{file_id}/generate/` | Generate public share link |
| GET | `/share/{token}/` | Access file via token (no auth) |
| GET/POST | `/share/{file_id}/permissions/` | Per-user permissions |

### Chunked Upload — `/upload/`
| Method | Path | Description |
|---|---|---|
| POST | `/upload/init/` | Initialize chunk session |
| POST | `/upload/chunk/` | Upload a chunk |
| POST | `/upload/complete/` | Assemble and create file |

### Activity — `/activity/`
| Method | Path | Description |
|---|---|---|
| GET | `/activity/` | List your activity log |

**API Docs:** `http://localhost:8000/api/docs/` (Swagger UI)

---

## ✨ Features

- **JWT Authentication** — register, login, logout, token refresh
- **File Management** — upload, download, rename, move between folders
- **Nested Folders** — unlimited depth folder hierarchy
- **SHA-256 Deduplication** — same file never stored twice per user
- **Trash System** — soft delete with restore and permanent delete
- **Starred Files** — bookmark important files
- **File Sharing** — public UUID-based links + per-user permissions
- **Chunked Upload** — large file support with resumable uploads and progress
- **ZIP Download** — select multiple files, download as ZIP
- **Preview** — in-browser image and PDF preview
- **Search** — case-insensitive filename search
- **Activity Log** — tracks all upload/download/delete/share events (async via Celery)
- **Storage Quota** — per-user storage tracking with 10GB default limit
- **Background Jobs** — Celery + Redis for async hashing, logging, zip generation
