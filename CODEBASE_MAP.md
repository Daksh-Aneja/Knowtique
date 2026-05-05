# KAEOS 1.0 (Knowledge-Augmented Enterprise OS) Codebase Map
> **Purpose**: Canonical reference so AI agents can navigate the codebase without re-reading every file.  
> **Last Updated**: 2026-05-05 | **Version**: 2.0.0 — KAEOS 5-Stratum Architecture

---

## Repository Structure
```
c:\Knowtique\
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point — 137 registered routes, CORS, Auth setup
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic Settings (DB, Redis, Kafka, LLM keys, thresholds)
│   │   │   ├── database.py     # AsyncSession factory — imports ALL model modules for create_all
│   │   │   └── seed.py         # Demo data seeder (seeds domain models & auth demo users)
│   │   ├── models/
│   │   │   ├── domain.py       # Core SQLAlchemy models (Rule, Skill, Employee, etc.)
│   │   │   ├── settings.py     # Platform config models
│   │   │   ├── agent_factory.py # Blueprint/Deploy/Debate/Feed models
│   │   │   ├── infrastructure.py # S1 Models: CostEvent, ModelConfig, AgentRegistry, Onboarding
│   │   │   └── auth.py         # RBAC models: User, UserRole (ADMIN/ANALYST/VIEWER)
│   │   ├── schemas/
│   │   │   └── ...             # Request/Response validation models
│   │   ├── api/routes/         # FastAPI routers (see §Routes below)
│   │   │   ├── infrastructure.py # N1-N4 Infrastructure routes
│   │   │   └── auth.py         # Authentication and User Management
│   │   ├── services/           # Business logic modules
│   │   │   ├── auth.py         # JWT Token & Password hashing
│   │   │   ├── model_management.py # N1: 4-tier model routing
│   │   │   ├── cost_governor.py    # N2: Token budgets & real-time telemetry
│   │   │   ├── agent_protocol.py   # N3: Async messaging & circuit breakers
│   │   │   └── onboarding_engine.py# N4: Cold-start state machine
│   │   └── agents/
│   │       └── runtime.py      # Execution pipeline
│   └── knowtique.db            # SQLite database (dev)
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx             # Main AppShell wrapped in AuthProvider & ThemeProvider
│   │   ├── main.tsx            # React DOM entry
│   │   ├── index.css           # Premium design system (Inter, Dark/Light mode)
│   │   ├── context/
│   │   │   ├── ThemeContext.tsx # Dark/Light mode provider
│   │   │   └── AuthContext.tsx  # JWT persistence, login state, RBAC role helpers
│   │   ├── api/client.ts       # Typed API functions for all endpoints
│   │   ├── components/         # Reusable UI elements
│   │   │   └── ChatCopilot.tsx # Slide-out conversational AI agent
│   │   ├── pages/              # Specific module pages
│   │   │   ├── LoginPage.tsx             # Premium Auth Gateway
│   │   │   ├── UserManagement.tsx        # RBAC User Control Panel (ADMIN only)
│   │   │   ├── ConnectorStudio.tsx       # S4: AI-driven data ingestion
│   │   │   ├── ExecutiveCockpit.tsx      # S4: High-density C-suite overview
│   │   │   ├── AnalystWorkspace.tsx      # S4: Scenario modelling & KG exploration
│   │   │   ├── InfrastructureDashboard.tsx # S4: N1-N4 infra visibility
│   │   │   └── OODAMonitor.tsx           # S4: Cognitive pipeline visualization
│   │   └── views/              # Core navigational containers
│   │       ├── KnowledgeView.tsx         # S0: Knowledge layer tabs
│   │       ├── AgentsView.tsx            # S2: Execution engine tabs
│   │       └── DecisionsView.tsx         # S4: Experience layer tabs
│   └── vite.config.ts
└── CODEBASE_MAP.md             # This file
```

---

## KAEOS Architecture — The 5 Stratums

| Stratum | Name | Purpose | Key Components |
|---------|------|---------|----------------|
| **S0** | Epistemic Brain | The core knowledge graph and ontology. | `domain.py`, KnowledgeView, ConnectorStudio |
| **S1** | Infrastructure | Core compute, routing, and governance (N1-N4). | `infrastructure.py`, CostGovernor, ModelRegistry |
| **S2** | Execution Engine | Active cognitive processing and agent pipelines. | `runtime.py`, AgentsView, OODAMonitor |
| **S3** | Strategic Intelligence | Higher-order reasoning and environmental sensing. | `pioneer.py`, `external_intelligence.py` |
| **S4** | Experience Layer | The human-machine interface. | ExecutiveCockpit, AnalystWorkspace, ChatCopilot |

---

## S1 Infrastructure Services (N1–N4)
Located in `backend/app/services/`:

1. **N1 Model Management** (`model_management.py`): 4-tier routing (Fast/Standard/Deep/Vertical), A/B canary testing, and prompt versioning.
2. **N2 Cost Governor** (`cost_governor.py`): Real-time telemetry, token budget enforcement (soft/hard limits).
3. **N3 Agent Protocol** (`agent_protocol.py`): Cross-agent async messaging, circuit breakers (OPEN/HALF-OPEN/CLOSED), capability registry.
4. **N4 Onboarding Engine** (`onboarding_engine.py`): Zero-to-one organization setup, intelligent schema mapping.

---

## Security, Auth & RBAC
- **Authentication**: JWT-based (no external dependencies, built directly with HMAC SHA-256).
- **Roles**:
  - `ADMIN`: Full system access + User Management CRUD operations.
  - `ANALYST`: Read and Execute access (can run agents, view dashboards).
  - `VIEWER`: Read-only access to dashboards and insights.
- **Frontend Guard**: `AuthGuard` in `App.tsx` prevents access to the Shell without a valid token. Unauthorized users are redirected to `LoginPage.tsx`.

---

## API Routes & Endpoints

### KAEOS Core
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `auth.py` | `/auth` | `POST /login`, `GET /me`, `POST /users`, `PUT /users/{id}/role` |
| `dashboard.py` | `/dashboard` | `GET /health`, `GET /cockpit`, `GET /ooda-events` |
| `infrastructure.py`| `/infrastructure`| `GET /models`, `GET /cost/telemetry`, `GET /agents`, `POST /onboarding` |

### Legacy AEOS Subsystems (Integrated)
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `rules.py` | `/rules` | CRUD + validate + provenance + history |
| `skills.py` | `/skills` | Browse, execute, HITL approve/reject, compile |
| `agent_factory.py` | `/agents` | Blueprint CRUD, compile, deploy, feed, debates |
| `topology.py` | `/topology` | Knowledge Graph endpoints (`GET /graph`) |

---

## Design System (S4 Layer)
- **Aesthetics**: Premium, Linear-inspired high-contrast UI.
- **Typography**: Primary font `Inter` across all views for maximum readability and a professional enterprise feel.
- **Theming**: Integrated Dark/Light mode via `ThemeContext.tsx`. Light mode specifically uses darkened ink variables for AA+ accessibility contrast.
- **Jargon Policy**: Removed legacy experimental terms (e.g., "Pioneer") from the UI, opting for clear enterprise terminology (e.g., "External Intelligence", "Strategic Analysis").

---

## Key Configuration (`backend/app/core/config.py`)

| Setting | Value | Purpose |
|---------|-------|---------|
| `API_PREFIX` | `/api/v1` | All routes prefixed |
| `DATABASE_URL` | `sqlite+aiosqlite:///./knowtique.db` | Dev database (includes `users` and `infrastructure` tables) |
| `CONFIDENCE_AUTONOMOUS_EXEC` | `0.82` | Agent auto-execution threshold |

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic 2.9 | ✅ Production |
| Database | SQLite (dev) / PostgreSQL (prod ready) | ✅ Active |
| Auth | Custom JWT + HMAC SHA-256 + RBAC | ✅ Integrated |
| Frontend | React 19 + Vite 8 + TypeScript + TailwindCSS | ✅ Production |
| Typography | Inter (Sans-serif) | ✅ Integrated |
