Technology Stack Overview

Frontend
Framework: React 19 with TypeScript (TSX) using Vite.
Components: Located under frontend/src/components/ (80+ components).
Styling: Vanilla CSS with custom design tokens, Tailwind CSS, Google Fonts (Inter/Outfit), and glass‑morphism effects.
State: React Context & Hooks.

Backend
Language: Python 3.11
Web Framework: FastAPI (backend/api/routes.py).
Business Logic: Modular services in backend/services/ (Valuation, AI, Risk, Benchmarking).
Data Layer: SQLAlchemy models (backend/database/models.py) with SQLite/PostgreSQL.
Validation: Pydantic models for request/response schemas.
Task Queue: Celery / BackgroundTasks.

Excel Add-in
Framework: React with Office.js.
Bundler: Webpack.
Features: Bi-directional sync, Authentication.

Testing & Quality
Python: PyTest unit & integration tests (test_*.py).
Frontend: TypeScript type‑checking (tsc), ESLint.

CI/CD & Deployment
Frontend: Vercel.
Backend: Docker container.
Database: PostgreSQL (Prod) / SQLite (Dev).

Miscellaneous
Version Control: Git repository.
Documentation: system_architecture.md, README.md.