# Data Retention Policy

## 1. Purpose
To ensure data is retained only as long as necessary for business, legal, and regulatory requirements, and is disposed of securely when no longer needed.

## 2. Data Classification
- **Category A (Critical)**: Customer financial data, valuation results, PII.
- **Category B (Internal)**: System logs, internal communications.
- **Category C (Public)**: Marketing materials, public website content.

## 3. Retention Periods
| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| **User Accounts** | Duration of subscription + 30 days | Service continuity and grace period. |
| **Valuation Data** | 7 years | Compliance with financial regulations (e.g., SOX, IRS). |
| **Audit Logs** | 1 year | Security auditing and forensic investigation. |
| **System Logs** | 90 days | Troubleshooting and performance monitoring. |
| **Backups** | 30 days | Disaster recovery. |

## 4. Data Deletion & Disposal
- **Customer Request**: Data is deleted within 30 days of a verified request (Right to be Forgotten / GDPR / CCPA).
    - **Process**: 
        1. Verify identity of requester.
        2. Soft delete from active database.
        3. Hard delete from database after 30 days.
        4. Remove from backups as they cycle out (30 days).
- **End of Service**: Data is securely wiped upon contract termination.
- **Secure Disposal**: 
    - Digital data is overwritten or crypto-shredded (deleting the encryption key).
    - Physical media (if any) is shredded or degaussed.

## 5. Backups & Recovery
- **Frequency**: 
    - **Point-in-Time Recovery (PITR)**: Continuous (5-minute window).
    - **Daily**: Incremental backups at 00:00 UTC.
    - **Weekly**: Full backups on Sundays at 00:00 UTC.
- **Storage**: Backups are stored in a separate region from the primary database for disaster recovery (DR).
- **Encryption**: All backups are encrypted at rest using AES-256.
- **Testing**: Restoration from backups is tested quarterly to verify data integrity and RTO/RPO targets.

