# KAEOS 1.0 (Knowledge-Augmented Enterprise OS) Codebase Map
> **Purpose**: Canonical reference so AI agents can navigate the codebase without re-reading every file.  
> **Last Updated**: 2026-05-05 | **Version**: 2.0.0 — KAEOS 5-Stratum Architecture

---

## Detailed Repository Structure

```text
c:\Knowtique\
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point — 137 registered routes, CORS, Auth setup
│   │   ├── core/
│   │   │   ├── auth.py         # Authentication core utilities
│   │   │   ├── config.py       # Pydantic Settings
│   │   │   ├── database.py     # AsyncSession factory
│   │   │   ├── seed.py         # Demo data seeder
│   │   │   └── tenant.py       # Multi-tenant isolation middleware
│   │   ├── models/
│   │   │   ├── auth.py         # User, UserRole RBAC models
│   │   │   ├── agent_factory.py# Blueprint, Deploy, Debate models
│   │   │   ├── calendar.py     # Temporal models
│   │   │   ├── domain.py       # Core entity models (Rule, Skill)
│   │   │   ├── fairness.py     # Ethical AI models
│   │   │   ├── infrastructure.py # CostEvent, AgentRegistry, Onboarding
│   │   │   └── settings.py     # Platform configuration models
│   │   ├── schemas/            # Pydantic Request/Response models
│   │   │   ├── agent_factory.py, dashboard.py, elicitation.py, rules.py, skills.py
│   │   ├── api/routes/         # 25 FastAPI routers
│   │   │   ├── agent_factory.py, auth.py, benchmark.py, conflicts.py
│   │   │   ├── connectors.py, dashboard.py, elicitation.py, enterprise.py
│   │   │   ├── extraction.py, federated.py, infrastructure.py, knowtique10x.py
│   │   │   ├── marketplace.py, pioneer.py, pipeline.py, platform_config.py
│   │   │   ├── polymorphic.py, predictive.py, provenance.py, redteam.py
│   │   │   └── rules.py, security.py, skills.py, topology.py
│   │   ├── services/           # 35 Business logic modules
│   │   │   ├── activity_feed.py, agent_protocol.py, auth.py, benchmark.py
│   │   │   ├── blueprint_generator.py, compiler.py, compliance.py, confidence.py
│   │   │   ├── cost_governor.py, debate_engine.py, elicitation.py, event_bus.py
│   │   │   ├── evolution.py, external_intelligence.py, extraction.py, fairness_engine.py
│   │   │   ├── federated_engine.py, ingestion.py, knowledge.py, lifecycle.py
│   │   │   ├── llm_router.py, model_management.py, onboarding_engine.py, org_intelligence.py
│   │   │   ├── pipeline_service.py, platform.py, polymorphic_engine.py, precog_engine.py
│   │   │   ├── predictive_ops.py, provenance.py, quantum_ledger.py, redteam.py
│   │   │   └── regulatory_engine.py, skill_executor.py, temporal_calendar.py
│   │   └── agents/
│   │       └── runtime.py      # Core execution pipeline
│   └── knowtique.db            # SQLite database (dev)
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx             # Main AppShell wrapped in AuthProvider & ThemeProvider
│   │   ├── main.tsx            # React DOM entry
│   │   ├── index.css           # Premium design system (Inter, Dark/Light mode)
│   │   ├── api/client.ts       # Typed API client wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.tsx # JWT persistence, login state
│   │   │   └── ThemeContext.tsx# Dark/Light mode provider
│   │   ├── components/         # Reusable UI elements
│   │   │   ├── ChatCopilot.tsx, DeployConfigModal.tsx, ExecutionDetailView.tsx
│   │   │   ├── SkillContractViewer.tsx, ThemeAdapter.tsx
│   │   ├── views/              # Core Navigational Containers
│   │   │   ├── AgentFactory.tsx, AgentsView.tsx, CommandCenter.tsx
│   │   │   ├── CompanyBrain.tsx, DecisionsView.tsx, KnowledgeView.tsx
│   │   │   └── SettingsView.tsx, TrustGovernance.tsx
│   │   └── pages/              # 39 Specific Module Pages
│   │       ├── AgentMonitor.tsx, AnalystWorkspace.tsx, BYOKView.tsx
│   │       ├── BenchmarkNetwork.tsx, ComplianceDashboard.tsx, ConflictArena.tsx
│   │       ├── ConnectorStudio.tsx, Dashboard.tsx, ElicitationHub.tsx
│   │       ├── ElicitationSimulator.tsx, EnterpriseCommandCenter.tsx, EvolutionTimeline.tsx
│   │       ├── ExecutiveCockpit.tsx, ExtractionHub.tsx, FederatedSettings.tsx
│   │       ├── GettingStarted.tsx, HITLQueue.tsx, InfrastructureDashboard.tsx
│   │       ├── IntegrationsHub.tsx, Knowtique10X.tsx, LLMRoutingSettings.tsx
│   │       ├── LoginPage.tsx, MCPToolManager.tsx, Marketplace.tsx, OODAMonitor.tsx
│   │       ├── OntologyConfig.tsx, PredictiveOps.tsx, ProvenanceLedger.tsx
│   │       ├── RedTeamDashboard.tsx, RulesExplorer.tsx, SecurityFabric.tsx
│   │       ├── SkillsRegistry.tsx, TopologyVisualizer.tsx, UserManagement.tsx
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
