# System Architecture

## Overview
The project is a web-based valuation platform designed to automate and analyze company valuations. It consists of a modern React-based frontend and a robust Python FastAPI backend. The system allows users to upload financial data (Excel), perform valuation calculations (DCF, sensitivity analysis), and visualize results through an interactive dashboard.

## Frontend Architecture

### Technology Stack
-   **Framework**: React 19 with TypeScript
-   **Build Tool**: Vite
-   **Routing**: React Router DOM v7
-   **Styling**: Tailwind CSS, Vanilla CSS (with custom design tokens)
-   **State Management**: React Hooks (useState, useEffect, Context)
-   **Visualization**: Recharts for charts and graphs
-   **Icons**: Lucide React

### Key Components
-   **Dashboard**: The main interface for visualizing valuation results.
    -   `DashboardHome.tsx`: Orchestrates the dashboard layout.
    -   `ResultsDashboard.tsx`: Displays key metrics.
    -   `ScenarioManager.tsx`: Handles scenario analysis.
-   **Valuation Tools**:
    -   `ManualEntryForm.tsx`: Allows manual input of financial data.
    -   `SheetMapping.tsx`: Handles mapping of uploaded Excel columns to system fields.
    -   `DCFViewModal.tsx`: Displays Discounted Cash Flow analysis.

### Project Structure (`frontend/src`)
-   `components/`: Reusable UI components.
-   `pages/`: Top-level page components.
-   `services/`: API integration logic.
-   `hooks/`: Custom React hooks.
-   `utils/`: Helper functions.

## Backend Architecture

### Technology Stack
-   **Language**: Python 3.11
-   **Framework**: FastAPI
-   **Database ORM**: SQLAlchemy
-   **Data Validation**: Pydantic
-   **Data Processing**: Pandas, OpenPyXL (for Excel parsing)
-   **Task Queue**: BackgroundTasks (FastAPI native)

### API Structure (`backend/api/routes.py`)
The API is RESTful and organized around key resources:
-   **Uploads**: `/upload` - Handles Excel file uploads.
-   **Valuation**:
    -   `/run/{file_id}`: Triggers valuation on uploaded files.
    -   `/calculate`: Performs manual valuation calculations.
    -   `/api/valuation/dcf`: specialized DCF calculations.
-   **Dashboard**:
    -   `/api/dashboard/portfolio`: Portfolio-level views.
    -   `/api/dashboard/executive`: Executive summary views.
-   **Export**: `/export/{run_id}` - Exports results to Excel, PDF, Word, PPT.

### Data Models (`backend/database/models.py`)
-   **User**: Handles authentication and user roles.
-   **ValuationRun**: Stores inputs, results, and metadata for each valuation execution.
-   **Company**: Stores company reference data.
-   **IndustryNorm**: Stores benchmarking data.
-   **AuditLog**: Tracks system usage and changes.

### Key Services (`backend/services/`)
-   `ValuationEngine`: Core logic for valuation calculations.
-   `SheetParser`: Parses uploaded Excel files.
-   `ExcelProcessor`: Processes parsed data and applies mappings.
-   `DashboardService`: Aggregates data for dashboard views.
-   `ReportGeneratorService`: Generates downloadable reports.

## Data Flow
1.  **Input**: User uploads an Excel file or enters data manually via the Frontend.
2.  **Processing**:
    -   **Upload**: File is saved to `uploads/` and parsed by `SheetParser`.
    -   **Mapping**: User maps columns in Frontend; `ExcelProcessor` normalizes data.
    -   **Calculation**: `ValuationEngine` computes valuation metrics (DCF, etc.).
3.  **Storage**: Results and inputs are stored in the `ValuationRun` table in the database (SQLite/PostgreSQL).
4.  **Visualization**: Frontend fetches results via Dashboard APIs and renders charts/tables.
5.  **Export**: User requests reports; Backend generates files using `ReportGeneratorService`.

## Deployment
-   **Frontend**: Configured for Vercel deployment.
-   **Backend**: Dockerized (Dockerfile present) for containerized deployment.
-   **Database**: SQLite for development/testing, PostgreSQL for production.
