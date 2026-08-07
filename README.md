# VU Backend

NestJS backend for the VU platform — authentication, job/mock management, candidate pipeline, AI service integration, and video upload via Cloudinary.

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | NestJS 11 | API server, dependency injection, modules |
| ORM | TypeORM 0.3 | PostgreSQL data access |
| Database | PostgreSQL 16 | Primary data store |
| Auth | JWT Bearer tokens | User authentication |
| Service Auth | API Key (`X-API-Key` header) | AI service → backend calls |
| Validation | class-validator + class-transformer | DTO validation, `forbidNonWhitelisted` |
| API Docs | Swagger (swagger-ui-express) | Auto-generated OpenAPI docs |
| File Upload | Cloudinary | Video recording storage + streaming |
| Mail | Nodemailer | Email verification (optional) |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Install

```bash
git clone https://github.com/vu-app-dev/vu-backend.git
cd vu-backend
npm install
cp .env.example .env   # edit with your database + secrets
```

### Run

```bash
npm run start:dev
# Runs on http://localhost:3000
# Swagger docs at http://localhost:3000/docs
```

### Run with Docker

```bash
docker build -t vu-backend .
docker run -p 3000:3000 --env-file .env vu-backend
```

> For the full stack (AI + backend + frontend + PostgreSQL), see the [vu-app](https://github.com/vu-app-dev/vu-app) orchestration repo.

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Auth | `auth-base/` | Registration, login, JWT, email verification |
| Users | `auth-base/user/` | User entity, profile management |
| Session | `auth-base/session/` | Session management |
| Companies | `companies/` | Company entity, team members |
| Jobs | `jobs/` | Job postings, configuration, mock attachment |
| Mocks | `mocks/` | Interview mock templates, questions |
| Candidates | `candidates/` | Candidate pipeline, AI results, performance |
| File | `core/file/` | File upload handling |
| Cloudinary | `core/cloudinary/` | Cloudinary integration for video uploads |
| Mail | `core/mail/` | Email service (Nodemailer) |
| Helper | `core/helper/` | Auth helpers, JWT utilities |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register_manager` | Register company manager |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/logout` | Logout |
| `POST` | `/auth/code_verify_request` | Request verification code |
| `POST` | `/auth/verify_email` | Verify email |

### Mocks
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mock/get/:mockId` | Get mock details (questions + config) |
| `GET` | `/mock/get_paginated` | List mocks with filters |
| `POST` | `/mock/create` | Create mock template |
| `PATCH` | `/mock/update/:mockId` | Update mock |
| `DELETE` | `/mock/delete/:mockId` | Delete mock |

### Candidates
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/candidates/get/:candidateId` | Get candidate with AI results |
| `GET` | `/candidates/get_paginated` | List candidates with filters |
| `POST` | `/candidates/apply/:companyId/:jobId` | Apply for job → returns `{ candidateId }` |
| `PATCH` | `/candidates/update/:candidateId` | Update candidate status |

### AI Service Endpoints (API Key auth — `X-API-Key` header)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/candidates/:id/performance` | Create performance record |
| `POST` | `/candidates/:id/cv-analysis` | Create CV analysis |
| `POST` | `/candidates/:id/questions` | Create Q&A record |
| `PATCH` | `/candidates/:id/performance` | Update cheat status |

> Swagger docs: `http://localhost:3000/docs`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USER` | Yes | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | Yes | `postgres` | PostgreSQL password |
| `DB_NAME` | Yes | `vu` | PostgreSQL database name |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `JWT_SECRET` | Yes | — | JWT signing secret (use a strong random string in production) |
| `AI_SERVICE_API_KEY` | Yes | — | Shared secret for AI service auth (must match AI service's `BACKEND_API_KEY`) |
| `AI_SERVICE_URL` | No | `http://localhost:8000` | AI service URL |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL (CORS) |
| `CLOUDINARY_CLOUD_NAME` | Optional | — | Cloudinary cloud name (for video uploads) |
| `CLOUDINARY_API_KEY` | Optional | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | — | Cloudinary API secret |
| `EMAIL_HOST` | Optional | `localhost` | SMTP host (for email verification) |
| `EMAIL_PORT` | Optional | `587` | SMTP port |
| `EMAIL_USERNAME` | Optional | — | SMTP username |
| `EMAIL_PASSWORD` | Optional | — | SMTP password |

## Notes

- **TypeORM `synchronize: true`** — schema is auto-synced on startup. No migration files needed. **Disable in production** for safety (or keep if you trust it during early development).
- **Validation Pipe**: `forbidNonWhitelisted: true` + `whitelist: true` — unknown fields in request bodies are rejected with 400.
- **CORS**: In development mode, all origins are allowed. In production, only `*.vuapp.dev` origins are allowed.

## Tests

```bash
npm test
npm run test:cov   # with coverage
```

## Project Structure

```
vu-backend/
├── src/
│   ├── main.ts                    # Bootstrap, Swagger, CORS, validation pipe
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   ├── database/              # TypeORM config
│   │   ├── guards/                # API key guard
│   │   ├── decorators/            # API key auth decorator
│   │   ├── filters/               # Exception filter
│   │   └── interceptors/          # Logger interceptor
│   └── modules/
│       ├── app/                   # Business modules
│       │   ├── auth-base/         # Auth, users, sessions
│       │   ├── candidates/        # Candidates + AI results
│       │   ├── companies/         # Companies + team
│       │   ├── jobs/              # Jobs
│       │   └── mocks/             # Mock templates
│       └── core/                  # Infrastructure modules
│           ├── cloudinary/        # Video upload
│           ├── file/              # File handling
│           ├── helper/            # Auth helpers
│           └── mail/              # Email
├── Dockerfile
└── package.json
```

## Related Repos

- [vu-app](https://github.com/vu-app-dev/vu-app) — Full-stack deployment (docker-compose)
- [vu-ai](https://github.com/vu-app-dev/vu-ai) — AI service (FastAPI)
- [vu-frontend](https://github.com/vu-app-dev/vu-frontend) — React frontend

## License

MIT