# Security Policy

## 1. Overview
This policy outlines the security measures and protocols for the Enterprise Valuation Automation platform to ensure the confidentiality, integrity, and availability of customer data. This policy applies to all employees, contractors, and third-party users.

## 2. Access Control
- **RBAC**: Access is restricted based on user roles (Viewer, Analyst, Manager, Admin).
    - **Viewer**: Read-only access to assigned valuations.
    - **Analyst**: Create and edit valuations.
    - **Manager**: Approve valuations and view team performance.
    - **Admin**: Full system access, user management, and audit log review.
- **Authentication**: 
    - Passwords must be at least 12 characters with mixed case, numbers, and symbols.
    - Multi-factor authentication (MFA) is enforced for all administrative access.
    - SSO (SAML 2.0/OIDC) is supported and recommended for enterprise clients.
- **Least Privilege**: Users are granted the minimum permissions necessary to perform their duties. Access rights are reviewed quarterly.
- **Offboarding**: Access is revoked immediately upon termination of employment or contract.

## 3. Data Protection
- **Encryption at Rest**: 
    - Database volumes and backups are encrypted using AES-256.
    - Application-level encryption (Fernet) is used for highly sensitive fields (e.g., assumptions, financial inputs).
- **Encryption in Transit**: 
    - All data transmission is secured via TLS 1.2+ using strong cipher suites.
    - HSTS is enabled to enforce HTTPS.
- **Key Management**: 
    - Encryption keys are managed via a secure Key Management Service (KMS).
    - Keys are rotated automatically every 90 days.
    - Access to keys is restricted to authorized services and personnel.

## 4. Network Security
- **Firewalls**: All servers are protected by firewalls with default-deny rules. Inbound traffic is restricted to necessary ports (443).
- **WAF**: Web Application Firewall is deployed to protect against common web attacks (OWASP Top 10), including SQL Injection and XSS.
- **DDoS Protection**: Automated mitigation is in place via the cloud provider (e.g., Cloudflare/AWS Shield).
- **Segmentation**: The network is segmented into public (DMZ), application, and database tiers.

## 5. Vulnerability Management
- **Scanning**: 
    - Automated static analysis (SAST) runs on every commit.
    - Dynamic analysis (DAST) runs weekly on staging environments.
    - Container images are scanned for vulnerabilities before deployment.
- **Patching**: 
    - Critical security patches are applied within 48 hours.
    - High severity patches within 7 days.
    - Medium/Low severity patches within 30 days.
- **Penetration Testing**: Third-party penetration tests are conducted annually.

## 6. Audit & Monitoring
- **Logging**: 
    - All critical actions (login, data export, valuation changes, user management) are logged.
    - Logs include timestamp, user ID, action type, resource ID, IP address, and before/after state.
- **Retention**: Audit logs are retained for 1 year in a write-once-read-many (WORM) storage.
- **Review**: Audit logs are reviewed quarterly by the Security Team. Suspicious activity triggers automated alerts.

## 7. Physical & HR Security
- **Physical Security**: The platform is hosted in SOC 2 Type II certified data centers (e.g., AWS/GCP) with strict physical access controls.
- **Background Checks**: All employees undergo background checks prior to employment.
- **Security Training**: All employees complete security awareness training upon hire and annually thereafter.

