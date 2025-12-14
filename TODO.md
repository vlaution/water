# Project TODO - Pending Items

This file tracks features and tasks that need to be completed later.

---

## 🔐 SSO Configuration

**Status:** Infrastructure complete, credentials needed

To make SSO fully functional:
1. Open `setup_sso_config.py`
2. Replace placeholder credentials with real ones from Google/Okta/Azure developer consoles
3. Run `python setup_sso_config.py` to update the database

**Files:** `setup_sso_config.py`, `backend/services/sso_service.py`

---

## 📊 Performance Dashboard Enhancements

**Status:** Complete

Implemented metrics:
- User engagement: "Active users" and "Avg sessions per user"
- Method popularity breakdown (DCF vs Comps vs LBO percentages)

**File:** `backend/services/metrics/aggregator.py`

---

## 📁 Excel Plugin Architecture

**Status:** Not started

Tasks:
- Create Office Add-in project structure
- Build `/api/excel/companies` endpoint
- Build `/api/excel/valuation/{id}/export` endpoint
- Build `/api/excel/import` endpoint
- Implement two-way sync logic

---

## 🔒 JWT Token Expiry

**Status:** Currently set to 100 years (dev mode)

Task: Update `backend/auth/jwt_handler.py` to use 24-hour expiry for production. Make configurable via environment variable.

---

## 🗄️ Token Blacklist

**Status:** In-memory implementation

Task: Replace in-memory `TokenBlacklist` with Redis-backed storage for persistence across restarts.

**File:** `backend/auth/jwt_handler.py`

---

## ⚡ Celery & Redis

**Status:** Configured but requires running services

To enable background processing:
```bash
# Start Redis server
redis-server

# Start Celery worker
celery -A backend.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A backend.celery_app beat --loglevel=info
```

---
