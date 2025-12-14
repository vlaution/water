Technology Stack Overview
Frontend
Framework: React with TypeScript (TSX) using Next.js for routing/SSR.
Components: Located under frontend/src/components/ (e.g., VCMethodModal.tsx, ScenarioManager.tsx).
Styling: Vanilla CSS with custom design tokens, Google Fonts (Inter/Outfit), and glass‑morphism effects defined in index.css.
Backend
Language: Python 3.11
Web Framework: FastAPI (backend/api/routes.py).
Business Logic: Centralized services in backend/services/ (dashboard_service.py, dashboard_config_service.py).
Data Layer: SQLAlchemy models (backend/database/models.py) with SQLite/PostgreSQL.
Validation: Pydantic models for request/response schemas.
Testing & Quality
Python: PyTest unit & integration tests (test_*.py).
Frontend: TypeScript type‑checking (tsc), ESLint, and component linting.
CI/CD & Deployment
Frontend: Vercel (auto‑deploy on push).
Backend: Docker container built via GitHub Actions; runs as a FastAPI service.
Demo Mode: Auth bypass flag with a "Try Demo" button in the UI.
Miscellaneous
Version Control: Git repository.
Documentation: README, API specs, and this tech‑stack file for onboarding.