# AIValueGuard

> **Tagline:** Optimize AI Costs. Preserve Quality. Scale Intelligently.  
> **Problem Statement:** Code Yudh Hackathon PS-08 — AI Cost Optimization Platform.

[![Tests](https://img.shields.io/badge/tests-19%20passed-emerald)](https://github.com/25BAI71138-ujjwal/AIvalueGuard)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Frontend-black?logo=vercel)](https://aivalueguard.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render-Live%20API-46E3B7?logo=render)](https://aivalueguard-backend.onrender.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?logo=typescript)](https://www.typescriptlang.org)

🌐 **Live Demo:** [https://aivalueguard.vercel.app](https://aivalueguard.vercel.app)  
⚡ **API Documentation:** [https://aivalueguard-backend.onrender.com/docs](https://aivalueguard-backend.onrender.com/docs)  
📦 **GitHub Repository:** [https://github.com/25BAI71138-ujjwal/AIvalueGuard](https://github.com/25BAI71138-ujjwal/AIvalueGuard)

---

## 1. Product Overview

AI applications often spend unnecessarily on expensive models, repeated API requests, excessive context, and inefficient inference workflows. Developers also need visibility into cost, latency, reliability, and response quality.

**AIValueGuard** sits between your application and upstream AI providers (OpenAI, Anthropic, Google Gemini, Groq). It optimizes incoming requests while respecting configurable quality, latency, reliability, and security requirements.

### Core Objective:
> **Find the lowest-cost eligible strategy that satisfies the application's required quality and performance constraints.**

---

## 2. Key Architecture & Central Gateway Pipeline

```
Incoming Request
       │
       ▼
[ Authentication & Tenant Isolation ]
       │
       ▼
[ Safe Exact-Match Cache Lookup ] ─────────► [ Cache Hit: 0 Token Cost, <10ms ]
       │ (Miss)
       ▼
[ Context Compaction & Budget Boundary ]
       │
       ▼
[ Multi-Criteria Routing Engine ] ─────────► [ Filters Ineligible Models & Ranks Lowest-Cost ]
       │
       ▼
[ Provider Execution + Bounded Fallback ] ──► [ OpenAI / Anthropic / Gemini / Groq / Demo ]
       │
       ▼
[ Structural Quality Validation ] ─────────► [ JSON Schema, Required Keys, Zero-Refusal ]
       │
       ▼
[ Persistence & Telemetry Audit Log ] ─────► [ SQLite / PostgreSQL + Cache Store ]
       │
       ▼
Client Response (with Cost, Tokens, Latency, and Reasoning Trace)
```

---

## 3. Core Capabilities & Implemented Sections

AIValueGuard is a **complete, production-quality, functional platform** with 9 fully implemented modules:

1. **Overview Dashboard**
   - Real-time total AI spend vs baseline benchmark spend.
   - Verified net savings and savings percentage calculation.
   - Cost per successful task, request volume, average and p95 latency.
   - Spending-over-time interactive chart (Recharts).
   - Inference model breakdown table and recent savings events.
   - Time-range filters (`24h`, `7d`, `30d`, `90d`).

2. **AI Playground**
   - Side-by-side strategy comparator.
   - **Baseline Mode:** Raw unoptimized invocation on configured baseline model (e.g., `gpt-4o`).
   - **Optimized Mode:** Invocation through AIValueGuard (caching, context reduction, model routing, quality verification).
   - Metrics compared side-by-side: Content output, token counts, dollar costs, latency, TTFT, cache status, quality score, and mathematical savings verdict.

3. **Gateway Requests Explorer**
   - Complete audit trail of all inference queries.
   - Filterable by keyword, status (`success`, `cached`, `fallback_success`, `quality_failed`), and cache state.
   - Inspectable **Execution Trace Drawer** detailing tokens, latency, cost attribution, routing reason, and context trimming.

4. **Models Catalog & Multi-Criteria Router**
   - Catalog supporting **GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3.5 Haiku, Gemini 1.5 Flash, Gemini 1.5 Pro, and Llama 3.3 70B (Groq)**.
   - Official per-1M input/output token pricing, context limits, latency estimates, and quality benchmarks.
   - **Interactive Router Simulator:** Adjust prompt length, latency SLA, and capability constraints (JSON, Vision) to preview real-time router decisions.

5. **Safe Caching System**
   - Cryptographic SHA-256 fingerprint incorporating `workspace_id`, `model`, `prompt`, `system_instruction`, `context`, and `temperature`.
   - Workspace tenant isolation guaranteeing zero cross-tenant leakage.
   - Automatic freshness expiration (24h TTL default) and manual cache invalidation.
   - Avoids caching error states or failed quality validations.

6. **Quality Evaluations & Structural Auditing**
   - Automated guardrails: JSON Schema syntax validation, required fields verification, minimum/maximum length constraints, and zero-refusal detection.
   - Bounded escalation recovery: retries with fallbacks and escalates to stronger model tiers when criteria fail.
   - **Live Quality Test Bench:** Paste completions directly into the UI to audit them against active guardrails.

7. **Cost Analytics**
   - Deep financial telemetry distinguishing provider-reported usage, calculated cost, estimated savings, and verified savings.
   - Attributed savings cards: Cache-avoidance savings, Multi-model routing savings, and Context compaction savings.
   - Internal optimization overhead tracking ($0.00002 / req).

8. **Optimization Laboratory**
   - Automated batch experiment runner on standardized benchmark datasets.
   - Evaluates test cases across categories (Customer Support, Entity Extraction, Code Generation, Summarization, Sentiment Analysis).
   - Exports results directly to **CSV** or **JSON**.

9. **Settings & Key Management**
   - Secure server-side credential management for OpenAI, Anthropic, Google Gemini, and Groq.
   - Quick one-click toggle for **Demo Mode** vs **Live Provider Mode**.
   - Default baseline benchmark configuration.

---

## 4. Savings Calculation Formula

AIValueGuard strictly implements the mathematical savings formula:

$$\text{Savings Percentage} = \left(\frac{\text{Baseline Total Cost} - \text{Optimized Total Cost}}{\text{Baseline Total Cost}}\right) \times 100$$

- **Optimization Overhead:** Included in the optimized total cost (internal gateway compute is factored in).
- **Zero Baseline Handling:** If baseline cost is $0.00, savings percentage defaults safely to $0.0\%$.

---

## 5. Dual Mode: Demo Mode vs Live Provider Mode

- **Demo Mode (Default):** Ready for hackathon presentation out-of-the-box without requiring API credentials or payment cards. Uses deterministic, high-fidelity mock responses, realistic simulated latencies, and stored demonstration records. Displays a visible **DEMO DATA** indicator.
- **Live Provider Mode:** Activated with one click once API credentials are configured in Settings. Executes live async HTTP requests to provider APIs.

---

## 6. Quickstart & Local Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Clone and Navigate
```bash
cd scratch/aivalueguard
```

### Step 2: Backend Setup
```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run automated tests
pytest -v backend/tests

# Launch backend server (starts on port 8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd scratch/aivalueguard/frontend

# Install dependencies
npm install

# Run frontend development server (starts on port 5173)
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 7. Docker & Docker Compose Setup

To deploy the entire stack using Docker Compose:

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API & Swagger Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 8. Automated Test Suite

Run the full backend test suite covering cost calculations, routing eligibility, cache isolation, quality validation, and API endpoints:

```bash
.\venv\Scripts\pytest.exe -v backend\tests
```

**Results:**
- `test_token_cost_calculation`: PASSED
- `test_savings_formula`: PASSED
- `test_zero_baseline_savings`: PASSED
- `test_cache_fingerprint_isolation`: PASSED
- `test_cache_fingerprint_temperature_sensitivity`: PASSED
- `test_quality_evaluator_json_validation`: PASSED
- `test_context_optimizer_deduplication`: PASSED
- `test_context_budget_enforcement`: PASSED
- `test_routing_engine_eligibility_and_ranking`: PASSED
- `test_health_endpoint`: PASSED
- `test_models_list_endpoint`: PASSED
- `test_analytics_overview_endpoint`: PASSED
- `test_gateway_chat_endpoint`: PASSED
- `test_playground_compare_endpoint`: PASSED

---

## 9. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & service readiness |
| `POST` | `/api/gateway/chat` | Central inference gateway endpoint |
| `POST` | `/api/playground/compare` | Side-by-side strategy execution |
| `GET` | `/api/requests` | List and search request traces |
| `GET` | `/api/requests/{id}` | Detailed execution trace |
| `GET` | `/api/models` | List configured models & pricing |
| `PUT` | `/api/models/{id}` | Update model configuration |
| `GET` | `/api/cache/stats` | Cache hit rate, tokens & cost saved |
| `POST` | `/api/cache/invalidate` | Manually evict cache entries |
| `GET` | `/api/evaluations/rules`| List active quality evaluation rules |
| `POST` | `/api/evaluations/run` | Live audit completion payload |
| `GET` | `/api/analytics/overview`| High-level operational metrics & chart |
| `GET` | `/api/analytics/costs` | Detailed cost & savings attribution |
| `POST` | `/api/experiments` | Run batch optimization lab experiment |
| `GET` | `/api/settings` | Platform settings & key configuration |
| `POST` | `/api/settings/toggle-demo`| Toggle between Demo & Live modes |

---

## 10. Remaining Limitations & Roadmap

- **Semantic Embedding Caching:** Exact-match cryptographic fingerprinting is fully implemented and tested. Semantic embedding distance matching requires an embedding model endpoint (e.g. `text-embedding-3-small`) to avoid hallucinations.
- **Provider Streaming (SSE):** Streaming chunk metrics are simulated in demo mode and supported via async adapter pipelines.
- **Role-Based Access Control (RBAC):** Current workspace isolation supports multi-tenant segregation; production multi-org SSO integration is planned for v1.1.

---

**Built with precision for Code Yudh Hackathon PS-08.**
