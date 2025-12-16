# Production Cluster Architecture

## 1. High-Level Overview
The system is architected as a cloud-native, microservice-ready application composed of four primary layers:
1.  **Ingress Layer**: Manages traffic entry, SSL termination, and static asset serving.
2.  **Application Layer**: Stateless compute containers for API (Python) and Logic (Wasm).
3.  **Worker Layer**: Asynchronous processing for heavy computations (Valuation/Compliance runs).
4.  **Data Layer**: Persistent storage and ephemeral caching.

```mermaid
graph TD
    User[User / Client] -->|HTTPS| LB[Load Balancer / Ingress]
    LB -->|Static Assets| FE[Frontend Cluster (Nginx + React/Wasm)]
    LB -->|API Requests| API[Backend API Cluster (FastAPI)]
    
    subgraph "Compute Cluster"
        API -->|Read/Write| DB[(PostgreSQL Primary)]
        API -->|Cache/PubSub| Redis[(Redis Cluster)]
        API -->|Async Tasks| Queue[Task Queue]
        Queue --> Worker[Celery Worker Cluster]
        Worker -->|Financial Models| Engine[Analysis Engine]
    end

    subgraph "External Services"
        API -->|Market Data| Alpha[Alpha Vantage API]
        API -->|Reg Updates| Regs[Regulatory Feeds]
    end
```

## 2. Component Details

### A. Frontend Cluster (`water-frontend`)
*   **Technology**: Nginx serving React (Vite) + WebAssembly.
*   **Role**: Serves the SPA and static assets. Nginx is configured to handle client-side routing (`index.html` fallback).
*   **Scaling**: Horizontally scalable (stateless). Setup behind a CDN (Cloudflare/CloudFront) for optimal performance.
*   **Wasm Integration**: Wasm modules are pre-compiled and served as static assets, executing entirely client-side for zero-latency interactions.

### B. Backend API Cluster (`water-backend`)
*   **Technology**: Python 3.9 + FastAPI + Uvicorn.
*   **Role**: REST API gateway, authentication, and orchestration of business logic.
*   **Scaling**: Horizontally scalable. Autoscaling based on CPU/Memory utilization.
*   **Key Middleware**:
    *   `CORSMiddleware`: Strict origin allowlisting.
    *   `HealthMonitor`: Metric logging middleware.
    *   `GlobalExceptionHandler`: Standardized error responses.

### C. Worker Layer (`celery-worker`)
*   **Technology**: Celery + Redis Broker.
*   **Role**: Handles long-running tasks to prevent blocking the API.
*   **Queues**:
    *   `default`: Standard valuation runs.
    *   `high_priority`: User alerts and immediate validations.
    *   `low_priority`: Scheduled aggregation and maintenance.
*   **Scaling**: Independent scaling based on queue depth (KEDA recommended for K8s).

### D. Data Layer
*   **Primary Database (PostgreSQL)**:
    *   Stores `ValuationRun`, `Company`, `User`, and `Compliance` records.
    *   Production Recommendation: Managed Service (AWS RDS, Google CloudSQL).
*   **Cache & Broker (Redis)**:
    *   Used for: Celery Task Queue, API Response Caching, Real-time Pub/Sub.
    *   Production Recommendation: Managed Redis (AWS ElastiCache).

## 3. Security & Networking
*   **VPC Design**:
    *   **Public Subnet**: Load Balancer / Ingress only.
    *   **Private Subnet**: Application Containers (Frontend/Backend).
    *   **Isolated Subnet**: Database and Redis (Access only via App Subnet).
*   **SSL/TLS**: Terminated at Load Balancer. Internal traffic can be HTTP or mTLS depending on compliance requirements.
*   **Secrets Management**: Environment variables injected via Secret Manager (e.g., Vault, AWS Secrets Manager).

## 4. Deployment Pipeline (CI/CD)
1.  **Build**: GitHub Actions triggers on `main`.
    *   Builds Docker images for Frontend and Backend.
    *   Runs Unit Tests (`pytest`) and Linting.
2.  **Publish**: Pushes images to Container Registry (ECR/GCR).
3.  **Deploy**: Updates the Orchestrator (Kubernetes/Docker Swarm) to roll out new image versions zero-downtime.

## 5. Monitoring & Observability
*   **Logs**: Centralized logging (ELK Stack / CloudWatch).
*   **Metrics**: Prometheus endpoint exposed by Backend.
*   **Tracing**: Request ID propagation through Nginx -> API -> Celery.
