# KnowledgeForge Backend

Adaptive AI study agent — FastAPI backend with async PostgreSQL, Qdrant vector DB, and Redis.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- Docker Desktop (for PostgreSQL, Qdrant, Redis)

## Setup

### 1. Start infrastructure services

From the project root:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432`
- **Qdrant** on `localhost:6333`
- **Redis 7** on `localhost:6379`

### 2. Configure environment variables

```bash
cp ../.env.example ../.env
```

Fill in the API keys in `../.env`:

```
ANTHROPIC_API_KEY=sk-ant-...   # Required — concept extraction via Claude
COHERE_API_KEY=...             # Optional until Phase 2 — reranking (dashboard.cohere.com)
```

Embeddings run locally via `sentence-transformers` (all-mpnet-base-v2) — no API key needed.

The database, Qdrant, and Redis URLs have working defaults for the Docker setup.

### 3. Install dependencies

```bash
cd backend
uv sync --extra dev
```

### 4. Run database migrations

```bash
uv run alembic upgrade head
```

### 5. Start the API server

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. OpenAPI docs at `http://localhost:8000/docs`.

## Running tests

```bash
uv run pytest tests/ -x -v
```
