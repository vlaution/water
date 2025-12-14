# Incident Response Plan

## 1. Purpose
To provide a structured, consistent, and effective approach for handling security incidents to minimize damage and recovery time.

## 2. Severity Levels
| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| **Sev 1 (Critical)** | Data breach, service outage, active exploitation. | SQL Injection, Ransomware. | < 1 hour |
| **Sev 2 (High)** | Significant risk, partial outage. | Suspicious admin activity, failed backups. | < 4 hours |
| **Sev 3 (Medium)** | Potential risk, no immediate impact. | Failed login spikes, unpatched non-critical vuln. | < 24 hours |
| **Sev 4 (Low)** | Minor issue, informational. | Policy violation, spam. | < 3 days |

## 3. Roles & Responsibilities
- **Incident Commander (IC)**: CTO / Head of Security. Responsible for overall coordination and decision making.
- **Response Team**: DevOps, Lead Developers. Responsible for technical investigation and remediation.
- **Communications Lead**: Legal / PR. Responsible for internal and external communication.

## 4. Incident Response Phases

### Phase 1: Identification
- **Detection**: Anomalies detected via monitoring tools (IDS, Logs, APM) or reported by users.
- **Triage**: IC determines the severity level and activates the appropriate response team.
- **Documentation**: Open an Incident Ticket to track all findings and actions.

### Phase 2: Containment
- **Short-term**: 
    - Isolate affected systems (take offline or disconnect from network).
    - Revoke compromised credentials immediately.
    - Block malicious IP addresses at the WAF/Firewall level.
- **Long-term**: 
    - Apply temporary patches or configuration changes.
    - Enable enhanced monitoring on affected systems.

### Phase 3: Eradication
- **Root Cause Analysis**: Identify the source of the breach (e.g., vulnerability, phishing).
- **Remediation**: 
    - Remove malware/backdoors.
    - Apply permanent security patches.
    - Rebuild compromised systems from clean images.

### Phase 4: Recovery
- **Restoration**: Restore data from clean backups (verify integrity first).
- **Validation**: Conduct thorough testing to ensure the system is secure and functioning correctly.
- **Monitoring**: Monitor the system closely for 24-48 hours for signs of recurrence.

### Phase 5: Post-Incident Activity
- **Post-Mortem**: Conduct a "Lessons Learned" meeting within 7 days.
- **Reporting**: Create a final Incident Report detailing the timeline, root cause, and impact.
- **Improvement**: Update security policies, playbooks, and the Incident Response Plan based on findings.

## 5. Contact List
- **Security Team**: security@example.com (24/7 PagerDuty)
- **Hosting Provider**: support@render.com
- **Legal Counsel**: legal@example.com
- **Cyber Insurance**: claims@insurance-provider.com

