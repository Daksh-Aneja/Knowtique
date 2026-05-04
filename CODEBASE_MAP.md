# Knowtique × AEOS Codebase Map — Agent Reference File
> **Purpose**: Canonical reference so AI agents can navigate the codebase without re-reading every file.  
> **Last Updated**: 2026-05-04 | **Version**: 2.0.0 — AEOS Pioneer Edition

---

## Repository Structure
```
c:\Knowtique\
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point — 112 registered routes, lifespan, CORS
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic Settings (DB, Redis, Kafka, LLM keys, thresholds)
│   │   │   ├── database.py     # AsyncSession factory — imports ALL model modules for create_all
│   │   │   └── seed.py         # Demo data seeder (40KB — seeds all domain models)
│   │   ├── models/
│   │   │   ├── domain.py       # 15 SQLAlchemy models (Rule, Skill, Employee, etc.)
│   │   │   ├── settings.py     # Platform config models (LLM/MCP/Ontology/Federated)
│   │   │   ├── agent_factory.py # AEOS models: AgentBlueprint, DeployedAgent, DebateTranscript, ActivityFeedEvent
│   │   │   ├── fairness.py     # AEOS P3: FairnessAuditLog, FairnessConfig
│   │   │   └── calendar.py     # AEOS P4: EnterpriseCalendar, TemporalAnomalyLog
│   │   ├── schemas/
│   │   │   ├── rules.py, skills.py, dashboard.py, elicitation.py
│   │   │   └── agent_factory.py # Blueprint/Deploy/Fairness/Calendar request models
│   │   ├── api/routes/         # 22 FastAPI routers (see §Routes below)
│   │   ├── services/           # 29 business logic modules (see §Services below)
│   │   ├── agents/
│   │   │   └── runtime.py      # AEOS Gate Pipeline: Compliance→Fairness→HITL→Debate→Execute→Audit
│   │   ├── connectors/         # ETL connector framework (csv, rest_api)
│   │   ├── transforms/         # ETL transform nodes (chunker, pii_scrubber)
│   │   └── destinations/       # ETL output (local_file, webhook)
│   └── knowtique.db            # SQLite database (dev)
├── frontend/                   # React + Vite + TypeScript + TailwindCSS v4
│   ├── DESIGN.md               # Linear-inspired design system reference
│   ├── src/
│   │   ├── App.tsx             # 5-view AppShell with dark/light theme toggle
│   │   ├── main.tsx            # React DOM entry
│   │   ├── index.css           # Linear design system (dark canvas, lavender accent, surface ladder)
│   │   ├── context/
│   │   │   └── ThemeContext.tsx # Dark/Light mode provider with localStorage persistence
│   │   ├── api/client.ts       # 60+ typed API functions — zero hardcoded data
│   │   ├── views/              # 5 consolidated views (see §Frontend Views below)
│   │   │   ├── CommandCenter.tsx  # Live health, activity feed, agent metrics
│   │   │   ├── AgentFactory.tsx   # NL→Blueprint→Compile→Deploy pipeline
│   │   │   ├── CompanyBrain.tsx   # Rules explorer, topology, elicitation
│   │   │   ├── TrustGovernance.tsx # Compliance, provenance, fairness, debates
│   │   │   └── SettingsView.tsx   # LLM routing, integrations, calendar, platform
│   │   └── pages/              # 23 legacy page components (accessible via import)
│   └── vite.config.ts
├── Req Docs/                   # Requirements documentation
│   ├── Knowtique_PRD_Full.md, AEOS_PRD_extracted.txt, AEOS_tables.txt
│   └── AEOS_PRD_v1.1_Pioneer.docx
└── CODEBASE_MAP.md             # This file
```

---

## AEOS Architecture — Pioneer Layer Integration

| Layer | Name | Status | Backend File(s) | Frontend View |
|-------|------|--------|----------------|---------------|
| L1-L5 | Core Knowtique (Rules, Skills, Elicitation) | ✅ Production | domain.py, rules.py, skills.py | CompanyBrain |
| L6-L10 | Intelligence (Confidence, Decay, Feedback) | ✅ Production | lifecycle.py, confidence.py, evolution.py | CommandCenter |
| L9 | AEOS Gate Pipeline (Compliance→Fairness→HITL→Debate→Execute→Audit) | ✅ Production | agents/runtime.py | AgentFactory |
| P1 | External Intelligence Layer | ✅ Production | external_intelligence.py, pioneer.py | CommandCenter (feed) |
| P2 | Organisational Intelligence | ✅ Production | org_intelligence.py, pioneer.py | SettingsView |
| P3 | Ethical AI & Bias Guardrails | ✅ Production | fairness_engine.py, fairness.py | TrustGovernance |
| P4 | Temporal Reasoning | ✅ Production | temporal_calendar.py, calendar.py | SettingsView |
| P5 | Federated Learning | ✅ Production | federated_engine.py | SettingsView |
| P6 | Agent Debate Engine | ✅ Production | debate_engine.py | TrustGovernance |
| L6 | Simulation & Digital Twin | ✅ Production | pioneer.py (what-if) | — |

---

## Domain Models

### Core Models (`models/domain.py`)
| Model | Table | Key Fields |
|-------|-------|------------|
| `Rule` | `rules` | `statement`, `confidence_vector` (5D), `confidence_scalar`, `confidence_tier`, `half_life_days` |
| `Skill` | `skills` | `skill_id`, `department`, `version`, `triggers`, `steps`, `mcp_tool_bindings`, `guardrails` |
| `SkillExecution` | `skill_executions` | `status`, `route_type`, `reasoning_chain`, `hitl_required`, `outcome_type` |
| `Employee` | `employees` | `authority_score`, `reputation_score`, `department`, `role` |
| `Signal` | `signals` | `source_type`, `signal_type`, `authority_score`, `novelty_score` |
| `ProvenanceLedger` | `provenance_ledger` | `event_type`, `chain_hash` (SHA-256), `reasoning` |

### AEOS Models (`models/agent_factory.py`)
| Model | Table | Key Fields |
|-------|-------|------------|
| `AgentBlueprint` | `agent_blueprints` | `name`, `status` (DRAFTING→APPROVED→COMPILED→DEPLOYED), `blueprint_graph` (DAG), `guardrails`, `intent_decomposition` |
| `DeployedAgent` | `deployed_agents` | `agent_name`, `status` (RUNNING/PAUSED/STOPPED), `execution_count`, `health_status` |
| `DebateTranscript` | `debate_transcripts` | `proposer_argument`, `advocate_argument`, `arbitrator_decision`, `escalated_to_hitl` |
| `ActivityFeedEvent` | `activity_feed_events` | `event_type` (22 types), `severity`, `title`, `event_metadata`, `requires_action` |

### AEOS P3 Models (`models/fairness.py`)
| Model | Table | Key Fields |
|-------|-------|------------|
| `FairnessAuditLog` | `fairness_audit_logs` | `fairness_score` (0-1), `passed`, `flagged_attributes`, `rationale`, `was_overridden` |
| `FairnessConfig` | `fairness_config` | `fairness_threshold`, `protected_attributes`, `monitored_entity_types` |

### AEOS P4 Models (`models/calendar.py`)
| Model | Table | Key Fields |
|-------|-------|------------|
| `EnterpriseCalendar` | `enterprise_calendar` | `calendar_type`, `start_date`, `end_date`, `priority_boost_pct`, `is_blocking` |
| `TemporalAnomalyLog` | `temporal_anomaly_logs` | `anomaly_type`, `expected_window`, `severity` |

---

## Backend Services (`backend/app/services/` — 29 modules)

| File | Class | Purpose | Wired? |
|------|-------|---------|--------|
| `llm_router.py` | `LLMRouter` | Tier-based model routing (Reasoning/Classification/Fast) via LiteLLM | ✅ |
| `blueprint_generator.py` | `BlueprintGenerator` | NL prompt → DAG blueprint with LLM decomposition | ✅ |
| `compiler.py` | `SkillsCompiler` | Blueprint → SKILL.md → Deployed Agent | ✅ |
| `debate_engine.py` | `DebateEngine` | Proposer/Advocate/Arbitrator adversarial reasoning | ✅ |
| `fairness_engine.py` | `FairnessEngine` | P3 demographic impact scoring across protected attributes | ✅ |
| `temporal_calendar.py` | `TemporalReasoningEngine` | P4 calendar-aware priority boosting & anomaly detection | ✅ |
| `external_intelligence.py` | `ExternalIntelligenceEngine` | P1 signal ingestion, cross-brain correlation, proactive alerts | ✅ |
| `org_intelligence.py` | `OrgIntelligenceEngine` | P2 change readiness, influence path planning, skills topology | ✅ |
| `activity_feed.py` | `ActivityFeedService` | Platform-wide real-time event bus (emit, query, mark-read) | ✅ |
| `confidence.py` | `ConfidenceEngine` | 5D weighted harmonic mean + Bayesian updates | ✅ |
| `lifecycle.py` | `DecayManager`, `FeedbackEngine` | Scheduled decay + agent outcome processing | ✅ |
| `evolution.py` | `EvolutionEngine` | Auto-generates elicitation on agent failure | ✅ |
| `provenance.py` | `ProvenanceEngine` | SHA-256 chain hashing + integrity verification | ✅ |
| `compliance.py` | `ComplianceEngine` | Pre/post execution compliance checks | ✅ |
| `redteam.py` | `RedTeamHarness` | Adversarial boundary testing | ✅ |
| `benchmark.py` | `BenchmarkEngine` | LLM-powered industry benchmark + intelligence reports | ✅ |
| `federated_engine.py` | `FederatedEngine` | P5 zero-knowledge skill weight export/import | ✅ |
| `predictive_ops.py` | `PredictiveOpsEngine` | Latent intent recognition | ✅ |
| `extraction.py` | `ContradictionDetector`, `RuleMiner` | LLM conflict detection + rule articulation | ✅ |
| `pipeline_service.py` | `PipelineService` | Full ETL: Extract→Transform→Load | ✅ |

---

## API Routes (112 endpoints across 22 routers)

### Core Knowtique
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `dashboard.py` | `/dashboard` | `GET /health`, `GET /compliance` |
| `rules.py` | `/rules` | CRUD + validate + provenance + history |
| `skills.py` | `/skills` | Browse, execute, HITL approve/reject, compile, explain |
| `elicitation.py` | `/elicitation` | `GET /dashboard`, `POST /answer`, `POST /generate` |
| `topology.py` | `/topology` | `GET /graph` |

### AEOS Agent Factory
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `agent_factory.py` | `/agents` | Blueprint CRUD, compile, deploy, stop, pause |
| `agent_factory.py` | `/agents/activity-feed` | Feed query, mark-read, action-required |
| `agent_factory.py` | `/agents/debates` | Recent debates, transcript by execution |
| `agent_factory.py` | `/fairness` | Audit log, override |
| `agent_factory.py` | `/calendar` | Events CRUD, temporal context |

### AEOS Pioneer Layers
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `pioneer.py` | `/intelligence` | P1: Signal ingest, correlate, proactive-alert |
| `pioneer.py` | `/org-intelligence` | P2: Change readiness, influence path, skills topology |
| `pioneer.py` | `/simulation` | L6: What-if simulation |

### Enterprise & Config
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| `enterprise.py` | Various | Health, search, export/import, reports, webhooks |
| `platform_config.py` | `/config` | LLM routing, MCP tools, ontology, federated CRUD |
| `benchmark.py` | `/benchmark` | `GET /network`, `GET /intelligence-report` |

---

## Frontend Architecture (5-View AppShell)

### Design System
- **Inspiration**: Linear.app + Stripe + Vercel merged design
- **Dark Mode**: Canvas `#010102`, Surface ladder (`#0f1011` → `#191a1b`), Lavender accent `#5e6ad2`
- **Light Mode**: Canvas `#FAFBFC`, Surface `#FFFFFF`, Same lavender accent
- **Typography**: Inter font, aggressive negative tracking on headlines
- **Theme**: `ThemeContext.tsx` with localStorage persistence + Sun/Moon toggle

### Views
| View | Component | API Endpoints Used |
|------|-----------|-------------------|
| Command Center | `CommandCenter.tsx` | `getHealth`, `getActivityFeed`, `getActionRequired` |
| Agent Factory | `AgentFactory.tsx` | `createBlueprint`, `listBlueprints`, `approveBlueprint`, `compileBlueprint`, `deployBlueprint`, `listDeployedAgents`, `stopAgent` |
| Company Brain | `CompanyBrain.tsx` | `getRules`, `getTopology`, `getElicitationDashboard`, `globalSearch` |
| Trust & Governance | `TrustGovernance.tsx` | `getComplianceReport`, `getProvenanceLedger`, `getFairnessLog`, `getRecentDebates` |
| Settings | `SettingsView.tsx` | `getLLMConfig`, `getConnectors`, `getCalendarEvents`, `getSystemStats` |

---

## LLM Model Tier Strategy

| Tier | Model | Use Cases |
|------|-------|-----------|
| **Reasoning** | `claude-sonnet-4-20250514` | Blueprint generation, debate engine, fairness scoring, simulations |
| **Classification** | `groq/llama-3.3-70b-versatile` | Intent routing, extraction, explainability, compliance |
| **Fast** | `groq/llama-3.3-70b-versatile` | Formatting, simple operations, status checks |

---

## Key Configuration (`backend/app/core/config.py`)

| Setting | Value | Purpose |
|---------|-------|---------|
| `API_PREFIX` | `/api/v1` | All routes prefixed |
| `DATABASE_URL` | `sqlite+aiosqlite:///./knowtique.db` | Dev database |
| `CONFIDENCE_AUTONOMOUS_EXEC` | `0.82` | Agent auto-execution threshold |
| `MAX_QUESTIONS_PER_WEEK` | `3` | Elicitation rate limit |
| `AGENT_SANDBOX_TIMEOUT_SEC` | `300` | Max agent execution time |

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic 2.9 | ✅ Production |
| Database | SQLite (dev) / PostgreSQL (prod) | ✅ Active |
| Frontend | React 19 + Vite 8 + TypeScript 6 + TailwindCSS 4 | ✅ Production |
| LLM | LiteLLM (BYOK) — Anthropic, Groq, OpenAI, Mistral, Ollama | ✅ Integrated |
| Design | Linear-inspired dark/light system with Inter + JetBrains Mono | ✅ Implemented |
| Icons | Lucide React (premium SVG library) | ✅ Integrated |
