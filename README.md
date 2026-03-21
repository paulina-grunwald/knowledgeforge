# KnowledgeForge

**An adaptive AI study agent that turns your notes into personalized quiz sessions.**

KnowledgeForge ingests your own study materials (Notion pages, PDFs, text files), extracts key concepts, and generates quiz questions using Retrieval-Augmented Generation (RAG). It tracks your learning state for each concept using the FSRS-6 spaced repetition algorithm and adapts questions to your current knowledge level.

## Key Features

- **Your Own Knowledge Source**: Every quiz question is generated from your uploaded materials — no external knowledge sources, only what you studied
- **Concept Extraction**: Automatically extracts and links concepts from your documents with prerequisite dependency mapping
- **Adaptive Learning**: Tracks concept mastery state (UNSEEN → EXPOSED → SHAKY → SOLID → STALE) using spaced repetition
- **Socratic Method**: Multi-turn quiz sessions with hints, follow-ups, and teach-back exercises
- **RAG-Powered Questions**: Hybrid retrieval (BM25 + semantic search + reranking) ensures questions are grounded in your actual notes
- **Multi-Format Support**: Ingest Notion pages, PDFs, and plain text
- **User Isolation**: Separate learning profiles with independent document libraries and study sets

## How It Works

```
1. Upload Documents
   └─ PDFs, Notion exports, or text files

2. Concept Extraction
   └─ Claude analyzes materials, extracts concepts with prerequisites

3. Build Study Sets
   └─ Group documents into corpora for specific exams/domains

WIP:
4. Quiz Sessions
   ├─ Generate questions via RAG (retrieval + LLM generation)
   ├─ Track knowledge state per concept
   ├─ Adapt difficulty based on mastery
   └─ Provide hints, follow-ups, and teach-back prompts

5. Analytics
   └─ View learning progress, blind spots, and prerequisite chains
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.12 |
| API | FastAPI 0.111+ (fully async) |
| ORM | SQLAlchemy 2.0 + asyncpg |
| Migrations | Alembic |
| Agent | LangGraph 0.2+ |
| RAG | LangChain 0.2+ |
| Vector DB | Qdrant |
| Embeddings | OpenAI `text-embedding-3-small` |
| Reranker | Cohere `rerank-english-v3.0` |
| LLM | Anthropic Claude Sonnet 4.5 |
| Cache | Redis 7 |
| Database | PostgreSQL 16 |
| Frontend | Next.js 14 App Router + TailwindCSS + shadcn/ui |
| Package Manager | uv |


## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (`uv` package manager)
- Anthropic, OpenAI, and Cohere API keys

### Setup

1. **Clone and install dependencies**
   ```bash
   cd backend
   uv sync --extra dev
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URL
   ```

3. **Start services (PostgreSQL, Redis, Qdrant)**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   cd backend
   alembic upgrade head
   ```

5. **Start the API server**
   ```bash
   cd backend
   uv run fastapi dev app/main.py
   ```

6. **Start the frontend** (in another terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

API: `http://localhost:8000`
Frontend: `http://localhost:3000`

### Running Tests

```bash
cd backend
uv run pytest tests/ -x -v
```

