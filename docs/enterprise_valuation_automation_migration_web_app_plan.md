# Enterprise Valuation Automation — Migration & Web App Plan

**Source file (uploaded):** `/mnt/data/valuation_automation_dashboard.xlsm`

> This document is a detailed technical plan your engineering, product, and design teams can use to migrate the Excel automation into a production-grade web application with a sleek glassmorphism UI and enterprise-grade architecture.

---

## 0) Executive summary

Build a secure, scalable web application that reproduces every automation and valuation calculation in the Excel model, accepts a single file upload (the provided workbook) to populate all inputs, and replaces Excel logic with a testable codebase. The UI should be high-tech glassmorphism style, mobile-responsive, and present a guided workflow: **Upload → Validate → Map Inputs → Run Valuation(s) → Results & Export**.

The source workbook path (for team reference) is: `/mnt/data/valuation_automation_dashboard.xlsm` (use this as the canonical input during ingestion).

---

## 1) High-level architecture

**Components**
- **Frontend (SPA)**: React + TypeScript, Tailwind CSS (for utility + integrate glassmorphism tokens), Vite build.
- **Design system**: Tailwind + custom tokens + component library (shadcn/ui optional) and Framer Motion for subtle micro-interactions.
- **Backend API**: FastAPI (Python) or Node.js (NestJS). *Recommendation:* **FastAPI** because Excel logic will rely heavily on Pandas / NumPy; Python simplifies porting formulas and supporting numerical precision.
- **Calculation Engine**: Python service implementing business rules & valuation algorithms; stateless; packaged as module(s) and callable via API or message queue worker.
- **Data store**: PostgreSQL for persistent records (projects, uploads, user metadata) + Redis for caching and short-lived state.
- **File storage**: S3-compatible object store (AWS S3, MinIO for on-prem). Store original upload and parsed JSON.
- **Task queue**: Celery + Redis (or RabbitMQ) for processing heavy valuation runs asynchronously and reliable retry.
- **Authentication & Authorization**: OpenID Connect (Auth0 / Okta / Keycloak) with RBAC for enterprise.
- **Observability**: Prometheus + Grafana for metrics, ELK/Opensearch or Cloudwatch for logs, Sentry for error tracking.
- **CI/CD**: GitHub Actions or GitLab CI to run lint, unit tests, integration tests, build images and deploy.
- **Deployment**: Kubernetes (EKS/GKE/AKS) or managed containers; helm charts; autoscaling.

**Network / Security**
- HTTPS everywhere using managed TLS.
- Private service-to-service communication via mTLS or VPC.
- Database encrypted at rest; S3 with server-side encryption.
- Audit logs for valuation runs and file downloads.

---

## 2) Data flow & UX workflow

**User flow pages / screens**
1. **Landing / Project list** — Projects, last runs, quick actions.
2. **New Project — Upload** — single file input (accept .xlsm, .xlsx, .csv). Drag & drop; show file metadata; ingest preview.
3. **Upload Validation & Mapping** — automatic parsing of sheets; present recognized sheets and required mapping for any missing sheet/column. Allow manual mapping if header variants are present.
4. **Input Review (Form)** — show a compact, collapsible form grouped by logical sections (matching 'Tab 1. User Input', 'Inp_1..4' etc.). Editable by user.
5. **Method Selection** — UI to enable/disable valuation methods (GPC, DCF_FCFF, DCF_FCFE, RCM, ANAV, Exit_M, GTM, IC). Show brief method descriptions and expected runtime.
6. **Run & Monitor** — start run (sync quick checks, then asynchronous full run). Show progress bars, logs, and estimated completion complexity (not time estimate; show step status only).
7. **Results Dashboard** — interactive summary charts, drill-down to method outputs, downloadable report (PDF/Excel), and ability to re-run with parameter tweaks.
8. **Audit & History** — store snapshots of inputs and outputs with versioning.

**Data flow**
- Upload endpoint receives workbook → store original file in S3 → start parsing job (fast sync parse + schema validation) → produce canonical JSON representation of all sheets and named ranges → persist JSON to DB as canonical input snapshot → user confirms / edits → enqueue valuation run job with snapshot id → calculation workers execute and save results to DB + S3 → frontend polls or subscribes to websocket for updates → results rendered and available for export.

---

## 3) Sheet → Module mapping (migration plan)

Use the sheet list discovered in the workbook to form modules. Each sheet becomes either: (A) parsed input, (B) calculation module, or (C) supporting data.

**Suggested mapping (each will be a Python module + unit tests):**
- `Cover` — Project metadata parser.
- `Tab 1. User Input>>`, `Inp_1`..`Inp_4` — **Input models**. Build Pydantic models for each input group (validation, types, defaults).
- `Flow` — Workflow configuration: maps steps and validation rules.
- `Tab 2. Valuation>>` — Controller to combine valuation outputs.
- `Method_Selc` — Feature flagging and method selector logic.
- `GPC` — module `valuations.gpc` implementing the GPC algorithm & sanity checks.
- `Exit_M`, `GTM`, `IC`, `RCM`, `ANAV`, `DCF_FCFF`, `DCF_FCFE` — individual valuation modules under `valuations.*`. Each module should:
  - expose a `run(inputs: ValuationInputs) -> ValuationResult` function,
  - include parameter validation and detailed debug output,
  - include unit tests reproducing the Excel output for several key rows.
- `Tab 3. Val Summary>>`, `ValSum ` — aggregation logic in `valuations.summary`.
- `Backend Input>>`, `GPC Input`, `IC Input` — canonical input transformers.
- `Back_end_links` — dependency graph builder (which outputs feed other modules).
- `WC & Capex` — supporting financial schedules module.
- `Tab 4. Upload Sheets>>`, `GPC Input Sheet`, `GTM Input` — raw upload / mapping UI helpers.

For each module, generate a **golden test** dataset derived from the Excel file: parse the sheet, store the canonical JSON, and assert that the module output equals the values in Excel for the same scenario.

---

## 4) Parsing & canonicalization

**Parser Design**
- Use `openpyxl` for .xlsx and .xlsm reading OR `pyxlsb` if necessary for binary xlsb. Because the workbook contains macros (.xlsm) the macros themselves are not executed — we only read data & formulas. Use `xlrd` only if required for legacy.
- Build `Parser` that reads each sheet and outputs a **canonical JSON** describing:
  - sheet name
  - table names / named ranges
  - header rows
  - typed rows (attempt to coerce to numeric/dates)
  - cell comments/notes (if present)

**Header mapping & fuzzy matching**
- Implement header synonym map and fuzzy header auto-mapping to handle small header differences.
- Provide UI to resolve mapping issues.

**Validation**
- Pydantic models and semantic checks (e.g., cashflows length must match forecast years).
- If validations fail, provide a step-by-step remediation UI.

---

## 5) Calculation engine: design & numerical fidelity

**Code organization**
- `calculations/` package with each valuation method as a module.
- Each module must include:
  - `spec.md` describing the algorithm, assumptions, and mapping to original Excel formula cells.
  - `run()` function returning structured output with intermediate traces.

**Numerical considerations**
- Use `decimal.Decimal` for currency-sensitive computations or ensure float tolerance with numpy dtype `float64` and explicit rounding rules matching Excel's precision.
- Be explicit about Excel's quirks (e.g., date serials, rounding). Create helper utilities to replicate `ROUND`, `XNPV`, `XIRR` behavior (Excel’s algorithms differ; tests must capture these differences).

**Traceability / explainability**
- Each valuation run must produce an auditable trace: inputs used, intermediate calculations, and final outputs. Store these traces in JSON for troubleshooting.

---

## 6) API design (OpenAPI-first)

Use FastAPI and expose OpenAPI; examples below.

### Key endpoints

- `POST /api/projects` — create project metadata.
- `POST /api/projects/{id}/upload` — upload workbook. Accept `multipart/form-data` file. Returns `upload_snapshot_id`.
- `GET /api/projects/{id}/uploads/{upload_id}` — get parsed sheet preview and validation errors.
- `POST /api/projects/{id}/uploads/{upload_id}/confirm` — confirm/correct mappings and commit canonical JSON.
- `POST /api/projects/{id}/runs` — start valuation run (body: methods, parameters, snapshot_id). Returns `run_id`.
- `GET /api/runs/{run_id}/status` — status and progress.
- `GET /api/runs/{run_id}/results` — get results (JSON + links to exports).
- `GET /api/exports/{export_id}` — download exported PDF/XLSX.

**Websocket / Notifications**
- `/ws/runs/{run_id}` — push progressive logs and completion notification.

---

## 7) Frontend architecture & glassmorphism UI spec

**Stack**
- React + TypeScript.
- Vite for build speed.
- Tailwind CSS with design tokens for translucency, blur, and soft shadows.
- Framer Motion for micro-interactions.
- Use component-first approach with Storybook for UI QA.

**Glassmorphism style guide**
- Background: deep, slightly desaturated gradient (e.g., indigo → teal) with subtle animated noise.
- Cards: translucent panels with `backdrop-filter: blur(10px)` + subtle border (1px) using `rgba(255,255,255,0.06)` or colored accents.
- Shadows: soft, diffused with neon rim glows for focus states.
- Accent: neon cyan / magenta for highlights, keep primary CTAs high contrast.
- Typography: Inter or Satoshi as primary font, variable weights. Use larger headings with letter spacing for a high-tech feel.
- Motion: subtle hover lifts, loading shimmer, and progress micro-animations.

**Key components**
- FileUploader (with preview and validation cards)
- SheetMapper (table preview + drag-drop column mapping)
- InputForm (grouped sections, collapsible, with inline validation)
- MethodSelector (grid of cards with toggles)
- RunMonitor (live logs, progress steps)
- ResultsDashboard (cards, tables, charts)
- ExportModal (PDF configuration, include/exclude sections)

**Accessibility**
- Ensure WCAG AA (contrast, keyboard nav, ARIA labels). Glass UI must keep text readable (use semi-opaque panels behind text where necessary).

**Design assets**
- Provide Figma file with components and tokens. Deliver Storybook for dev handoff.

---

## 8) Testing strategy

**Automated tests**
- Unit tests for every calculation module, with fixtures derived from the Excel workbook.
- Integration tests for parser → canonical JSON → calculations to ensure parity with Excel.
- API contract tests (OpenAPI-driven) and e2e tests (Cypress or Playwright) for key flows.

**Golden tests**
- For 10–20 important cells / key outputs from Excel, assert equality or acceptable tolerance between Excel and engine outputs. Keep these golden spreadsheets under `tests/fixtures/`.

**Performance**
- Load testing for concurrent runs (k6), and profiling of heavy methods (where appropriate, vectorize with NumPy or consider Cython if hot loops appear).

---

## 9) Security & compliance

- Enterprise SSO (OIDC) + role-based authorization.
- Per-tenant data separation (if multi-tenant): schema-per-tenant or proper tenant_id scoping.
- File scanning for malware on upload.
- Audit log of all runs, exports, and user actions. Provide exportable audit logs for compliance.
- Data retention policy with automatic purge capabilities. Allow admins to mark retention windows.

---

## 10) Monitoring, logging & observability

- Application metrics (Prometheus) for run times, queue sizes, success/failure rates.
- Structured logs (JSON) and centralized aggregator (ELK or OpenSearch).
- Error tracking via Sentry for full stack traces.
- Health endpoints and readiness/liveness probes.

---

## 11) CI/CD and release plan

- Repo structure: `frontend/`, `backend/`, `calculations/`, `infra/`, `tests/`, `docs/`.
- CI steps: install deps, static checks (eslint, flake8), unit tests, build artifacts, run integration tests on PRs, build containers on main, push to registry.
- CD: Use image tags from CI; deploy to staging automatically; gated production deploy via merge or promotion step with approvals.
- Use canary or blue/green deployment for production upgrades.

---

## 12) Deliverables & acceptance criteria

**Minimum Viable Enterprise Release (MVER)**
- Upload flow ingests `/mnt/data/valuation_automation_dashboard.xlsm` and auto-maps main sheets.
- All major valuation methods ported and unit-tested against Excel golden outputs (at least 80% of key outputs matching within tolerance).
- Frontend implements glassmorphism UI for the full workflow: Upload → Map → Run → Results.
- Authentication via OIDC and role-based access for admin/analyst/viewer.
- Export to PDF and XLSX of full results.
- Logging, monitoring, and CI pipelines configured.

**Acceptance tests**
- Given the original workbook, the system reproduces the final summary values in `ValSum` sheet for at least 3 test scenarios.
- Upload/edit/run/export flows succeed with no errors in staging.

---

## 13) Implementation plan (phased)

**Phase 0 — Discovery (1 week)**
- Inventory of Excel formulas, identify macros (if macros contain logic beyond static cells) and create mapping matrix.
- Produce `spec.md` mapping Excel cells / named ranges → code functions.

**Phase 1 — Core infra & parser (2–3 weeks)**
- Setup repo, CI, infra skeleton, S3, DB.
- Implement parser; produce canonical JSON from the sample workbook.

**Phase 2 — Calculation engine & golden tests (3–5 weeks)**
- Implement core valuation modules, unit tests against golden values.
- Ensure numerical parity and traceability.

**Phase 3 — Frontend MVP (2–3 weeks)**
- Upload UI, mapping UI, input review, run trigger, and basic results view.
- Storybook and Figma components.

**Phase 4 — Polishing & enterprise features (2–3 weeks)**
- Exports, audit logs, SSO, RBAC, advanced monitoring, and QA.

**Phase 5 — Hardening & production rollout (ongoing)**
- Load testing, security review, scalability tuning, and final cutover.

> The above are *phases* with recommended effort; teams should split into parallel workstreams: parser + calculations, frontend + design, infra/security.

---

## 14) Engineering checklist / playbook (actionable items for dev teams)

**For Backend / Calculations team**
- [ ] Install python environment with reproducible versions (poetry / pip-tools).
- [ ] Build parser to read sheets listed in workbook.
- [ ] Create Pydantic models for inputs and validation rules.
- [ ] Implement `valuations` package with modules matching sheets.
- [ ] Create trace output format and store to S3/DB.
- [ ] Add golden unit tests (use parsed sample workbook fixtures).

**For Frontend / Design team**
- [ ] Create Figma file and component library with glassmorphism tokens.
- [ ] Implement React components with Tailwind + Framer Motion.
- [ ] Integrate file upload to backend and sheet mapping UI.
- [ ] Implement results dashboard using Recharts or similar.

**For Infra / Security team**
- [ ] Configure object storage, DB, and Redis.
- [ ] Set up CI/CD and container registry.
- [ ] Configure OIDC provider and RBAC roles.
- [ ] Configure monitoring and alerting rules.

**For QA**
- [ ] Create test plan focused on numerical parity, security, and e2e flows.
- [ ] Maintain golden spreadsheets in repo.

---

## 15) Additional implementation notes & tips

- Excel macros (.xlsm) are not executable on the server. If business logic lives in VBA macros, extract those algorithms and translate them into Python functions.
- Keep user edits to canonical JSON versioned — this enables reproducible runs for audits.
- Consider a "comparison mode" UI that shows Excel value vs engine value side-by-side for any cell or KPI.
- Provide a developer `--excel-mode` that can run a quick in-memory Excel (e.g., via `xlwings` with an installed Excel instance) for validation when necessary; but do not rely on this in production.

---

## 16) What I included from your uploaded workbook

- The plan assumes the sheet set discovered and uses `/mnt/data/valuation_automation_dashboard.xlsm` as the canonical input for building golden test fixtures and mapping.

---

## 17) Next recommended actions for your teams (immediately actionable)

1. **Assign owners** for Parser, Calculations, Frontend, Infra, and QA.
2. **Kick off Discovery**: get a developer to run the parser against `/mnt/data/valuation_automation_dashboard.xlsm` and produce the canonical JSON snapshot.
3. **Create the repo skeleton** and add CI templates and coding standards.
4. **Produce the first golden tests**: export the key output cells from the workbook and store them under `tests/fixtures/`.

---

## Appendix A — Example OpenAPI snippet

```
POST /api/projects/{project_id}/upload
Request: multipart/form-data: file (.xlsm)
Response: 202
{
  "upload_id": "uuid",
  "status": "parsing",
  "sheets": ["Cover","Tab 1. User Input>>","Flow",...]
}
```

```
POST /api/projects/{project_id}/runs
Request JSON:
{
  "snapshot_id": "uuid",
  "methods": ["DCF_FCFF", "GPC"],
  "overrides": {"discount_rate": 0.12}
}
Response: 202 {"run_id":"uuid","status":"queued"}
```

---

If you'd like, I can now also produce:
- A technical **README** + repository skeleton (file tree + example code) your backend team can clone and start with, OR
- A **Figma style board + Storybook** starter (component tokens and a few key components mocked), OR
- A **detailed mapping spreadsheet** that enumerates Excel cell ranges → code functions (auto-generated from the parser) ready for handoff.

Choose one of these and I will embed it into this repo plan or produce the next artifact for your teams.

---

*Prepared for enterprise handoff — use this document as the central spec to brief engineers, designers, and infra teams.*

