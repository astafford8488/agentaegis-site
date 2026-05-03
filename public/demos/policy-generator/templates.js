// AgentAegis — Client-side policy generator (matches the actual MCP tool output schema)

(function () {
  "use strict";

  const today = () => new Date().toISOString().split("T")[0];
  const inOneYear = () => new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  function meta(orgName, frameworks) {
    return {
      organization: orgName,
      version: "1.0",
      effective_date: today(),
      next_review_date: inOneYear(),
      owner: "Information Security Team",
      applicable_frameworks: frameworks,
    };
  }

  const TEMPLATES = {
    incident_response: (cfg) => ({
      title: `${cfg.organization_name} — Incident Response Policy`,
      metadata: { policy_type: "incident_response", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `This policy establishes the framework for identifying, responding to, and recovering from information security incidents at ${cfg.organization_name}. It ensures a consistent, coordinated approach to minimizing the impact of security events.` },
        { heading: "2. Scope", content: `This policy applies to all employees, contractors, and third parties with access to ${cfg.organization_name}'s information systems. It covers all types of security incidents including unauthorized access, data breaches, malware, denial of service attacks, and insider threats.` },
        { heading: "3. Incident Classification", content: "Incidents are classified by severity:", sub_items: [
          "<strong>P1 (Critical):</strong> Active data breach, ransomware, or system compromise affecting production. Response: immediate (within 15 minutes).",
          "<strong>P2 (High):</strong> Confirmed malware, unauthorized access attempt to sensitive systems. Response: within 1 hour.",
          "<strong>P3 (Medium):</strong> Suspicious activity, policy violations, phishing attempts. Response: within 4 hours.",
          "<strong>P4 (Low):</strong> Minor policy violations, informational security events. Response: within 24 hours.",
        ]},
        { heading: "4. Roles and Responsibilities", content: "The Incident Response Team consists of:", sub_items: [
          "<strong>Incident Commander:</strong> Leads response, makes escalation decisions",
          "<strong>Security Analyst:</strong> Investigates and contains the incident",
          "<strong>Communications Lead:</strong> Manages internal/external communications",
          "<strong>Legal/Compliance:</strong> Advises on regulatory obligations",
          cfg.org_size === "small" ? "<em>Note: in smaller organizations one person may fill multiple roles.</em>" : "<strong>Operations Lead:</strong> Coordinates system recovery",
        ]},
        { heading: "5. Response Procedures", sub_items: [
          "<strong>Detection &amp; Identification:</strong> Validate the incident, determine scope and impact",
          "<strong>Containment:</strong> Isolate affected systems to prevent spread (short-term and long-term containment)",
          "<strong>Eradication:</strong> Remove the threat from all affected systems",
          "<strong>Recovery:</strong> Restore systems to normal operation, verify integrity",
          "<strong>Post-Incident Review:</strong> Conduct retrospective within 5 business days of resolution",
        ]},
        { heading: "6. Communication &amp; Notification", content: `${cfg.organization_name} will notify affected parties as follows:`, sub_items: [
          "<strong>Internal:</strong> All P1/P2 incidents communicated to executive team within 2 hours",
          "<strong>Customers:</strong> Notified within 72 hours of confirmed data breach (per GDPR) or as required by applicable law",
          cfg.industry === "healthcare" ? "<strong>HHS:</strong> HIPAA breach notification within 60 days for breaches affecting 500+ individuals" : null,
          cfg.frameworks.includes("pci") ? "<strong>Card brands and acquiring bank:</strong> Within contractual timeframe (typically 24 hours of suspected compromise)" : null,
          "<strong>Regulators:</strong> As required by applicable law and contractual obligations",
          "<strong>Law Enforcement:</strong> For incidents involving criminal activity, in coordination with legal counsel",
        ].filter(Boolean) },
        { heading: "7. Evidence Preservation", content: "All incident evidence must be preserved following chain-of-custody procedures. This includes system logs, memory dumps, disk images, network captures, and communications related to the incident. Evidence must be stored in a tamper-evident manner for at least 3 years." },
        { heading: "8. Policy Review", content: `This policy is reviewed annually and after any P1/P2 incident. Tabletop exercises are conducted at least annually to validate response procedures. Owner: ${cfg.organization_name} CISO or designated security leader.` },
      ],
    }),

    acceptable_use: (cfg) => ({
      title: `${cfg.organization_name} — Acceptable Use Policy`,
      metadata: { policy_type: "acceptable_use", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `This policy defines acceptable use of ${cfg.organization_name}'s information technology resources to protect the organization, its employees, and its customers.` },
        { heading: "2. Scope", content: `Applies to all employees, contractors, and authorized users of ${cfg.organization_name}'s IT resources including but not limited to computers, networks, email, internet access, and cloud services.` },
        { heading: "3. General Use", sub_items: [
          "IT resources are provided primarily for business purposes",
          "Limited personal use is permitted if it does not interfere with work duties or violate this policy",
          "Users are responsible for the security of their accounts and devices",
          "All activity on company resources is subject to monitoring",
        ]},
        { heading: "4. Prohibited Activities", sub_items: [
          "Accessing, downloading, or distributing illegal or inappropriate content",
          "Unauthorized access to systems or data",
          "Installing unauthorized software",
          "Sharing credentials or access",
          "Circumventing security controls",
          "Using company resources for personal commercial activities",
          "Sending unsolicited bulk communications",
          cfg.industry === "fintech" ? "Accessing customer financial data for any purpose other than approved business need" : null,
          cfg.industry === "healthcare" ? "Accessing protected health information (PHI) for any purpose other than treatment, payment, or operations" : null,
        ].filter(Boolean) },
        { heading: "5. Email &amp; Communications", sub_items: [
          "Use professional language in all business communications",
          "Do not open suspicious attachments or click unknown links",
          "Report phishing attempts immediately to security@" + cfg.organization_name.toLowerCase().replace(/\s+/g, "") + ".com",
          "Sensitive data must not be sent via unencrypted email",
        ]},
        { heading: "6. Remote Work", content: cfg.org_size !== "small" ? "Remote work is supported. Additional security measures apply: use company VPN, lock screens when away, ensure home network is secured (WPA2/WPA3), do not use public WiFi without VPN, and never store company data on personal devices." : "Remote access must be approved by management and secured via VPN." },
        { heading: "7. Enforcement", content: "Violations may result in disciplinary action up to and including termination and legal action. Suspected violations should be reported to HR or the security team." },
      ],
    }),

    access_control: (cfg) => ({
      title: `${cfg.organization_name} — Access Control Policy`,
      metadata: { policy_type: "access_control", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Establish access control requirements to protect ${cfg.organization_name}'s information systems and data from unauthorized access.` },
        { heading: "2. Principles", sub_items: [
          "<strong>Least Privilege:</strong> Users receive minimum access required for their role",
          "<strong>Need-to-Know:</strong> Access to data granted only when required for job function",
          "<strong>Separation of Duties:</strong> No single individual should control all aspects of a critical process",
          "<strong>Default Deny:</strong> Access is explicitly granted, never assumed",
        ]},
        { heading: "3. Account Management", sub_items: [
          "All access requires formal request and management approval",
          "Accounts provisioned within 24 hours of approved request",
          "Access removed within 24 hours of employment termination",
          "Accounts disabled after 90 days of inactivity",
          "Service accounts documented and reviewed quarterly",
          "Generic/shared accounts prohibited except for documented exceptions",
        ]},
        { heading: "4. Authentication", sub_items: [
          "Multi-factor authentication required for <strong>all</strong> accounts",
          "Passwords: minimum 12 characters, complexity required",
          "Admin accounts: hardware security keys (FIDO2) required",
          "Session timeout: 15 minutes of inactivity",
          cfg.frameworks.includes("pci") ? "PCI scope systems: re-authentication required after 15 minutes regardless of activity" : null,
        ].filter(Boolean) },
        { heading: "5. Access Reviews", content: `User access reviews conducted quarterly. ${cfg.org_size === "small" ? "IT manager" : "Department managers"} certify access appropriateness for their teams. Reviews must produce documentation showing each user reviewed, decision made, and any access revoked.` },
        { heading: "6. Privileged Access", sub_items: [
          "Privileged access logged in detail (commands, queries, file access)",
          "Privileged sessions monitored in real-time for high-risk systems",
          "Just-in-time access required for production database access",
          "Break-glass procedures documented and tested annually",
        ]},
        { heading: "7. Remote Access", content: cfg.industry === "fintech" ? "Access to production systems requires SSO via the corporate identity provider, with FIDO2 hardware key MFA. Direct database access is prohibited; all queries go through audited service accounts." : "Access to cloud systems requires SSO via corporate identity provider. Direct credential access prohibited." },
      ],
    }),

    data_classification: (cfg) => ({
      title: `${cfg.organization_name} — Data Classification Policy`,
      metadata: { policy_type: "data_classification", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `This policy establishes a data classification framework to ensure ${cfg.organization_name} protects information assets according to their sensitivity and value.` },
        { heading: "2. Classification Levels", sub_items: [
          "<strong>PUBLIC:</strong> Information intended for public consumption. No restrictions on sharing.",
          "<strong>INTERNAL:</strong> Business information not intended for public release. Share only with authorized employees.",
          "<strong>CONFIDENTIAL:</strong> Sensitive business information. Access on need-to-know basis. Includes: " + (cfg.industry === "fintech" ? "customer PII, transaction history, account details" : cfg.industry === "healthcare" ? "PHI, medical records, treatment information" : "customer PII, financial records, intellectual property") + ".",
          "<strong>RESTRICTED:</strong> Highest sensitivity. Includes credentials, encryption keys, and regulated data" + (cfg.frameworks.includes("pci") ? " (cardholder data, CVV codes)" : "") + ". Strict access controls required.",
        ]},
        { heading: "3. Handling Requirements", sub_items: [
          "<strong>RESTRICTED:</strong> Encrypted at rest and in transit, access logged, no external sharing without legal approval",
          "<strong>CONFIDENTIAL:</strong> Encrypted in transit, access controlled, sharing requires management approval",
          "<strong>INTERNAL:</strong> Reasonable access controls, no public sharing",
          "<strong>PUBLIC:</strong> No special handling required",
        ]},
        { heading: "4. Data Owners", content: "Each data asset must have a designated owner responsible for classification, access decisions, and periodic review. Owners are documented in the data inventory." },
        { heading: "5. Retention &amp; Disposal", content: "Data must be retained per legal/regulatory requirements and securely disposed of when no longer needed. Secure disposal means cryptographic erasure or physical destruction." + (cfg.frameworks.includes("pci") ? " Cardholder data must be deleted within 12 months of last use unless required for regulatory reasons." : "") },
        { heading: "6. Cross-Border Transfers", content: "Transfers of CONFIDENTIAL or RESTRICTED data across jurisdictions must be reviewed by legal for compliance with applicable laws (GDPR, CCPA, etc.). Standard contractual clauses or equivalent protections required." },
      ],
    }),

    change_management: (cfg) => ({
      title: `${cfg.organization_name} — Change Management Policy`,
      metadata: { policy_type: "change_management", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Establish a controlled process for managing changes to ${cfg.organization_name}'s information systems to minimize risk and disruption.` },
        { heading: "2. Change Categories", sub_items: [
          "<strong>Standard:</strong> Pre-approved, low-risk changes (e.g., minor patches, config updates)",
          "<strong>Normal:</strong> Requires review and approval before implementation",
          "<strong>Emergency:</strong> Critical changes needed to restore service or address security threats",
        ]},
        { heading: "3. Change Process", sub_items: [
          "<strong>Request:</strong> Document change, reason, risk assessment, rollback plan",
          "<strong>Review:</strong> Peer review of technical implementation",
          "<strong>Approve:</strong> Change Advisory Board (CAB) approval for Normal changes",
          "<strong>Implement:</strong> Execute during approved maintenance window",
          "<strong>Verify:</strong> Confirm change is functioning as expected",
          "<strong>Close:</strong> Document outcome and lessons learned",
        ]},
        { heading: "4. Approval Matrix", sub_items: [
          cfg.org_size === "small" ? "<strong>Standard:</strong> auto-approved with peer review" : "<strong>Standard:</strong> team lead approval",
          "<strong>Normal:</strong> CAB approval (meets weekly)",
          "<strong>Emergency:</strong> single approver from on-call management, retroactive CAB review within 48 hours",
          cfg.frameworks.includes("pci") ? "<strong>PCI scope changes:</strong> security review required, documented in change record" : null,
        ].filter(Boolean) },
        { heading: "5. Code Changes", sub_items: [
          "All code changes require version control (Git)",
          "Pull/merge requests required with at least one reviewer",
          "Automated security tests (SAST, secrets, deps) must pass before merge",
          "Production deployments require explicit approval gate",
          "Database migrations reviewed by DBA or senior engineer",
        ]},
      ],
    }),

    vendor_management: (cfg) => ({
      title: `${cfg.organization_name} — Vendor Management Policy`,
      metadata: { policy_type: "vendor_management", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Establish requirements for assessing and managing the security risks associated with ${cfg.organization_name}'s third-party vendors and service providers.` },
        { heading: "2. Vendor Classification", sub_items: [
          "<strong>Critical:</strong> Vendors with access to CONFIDENTIAL/RESTRICTED data or critical systems",
          "<strong>Standard:</strong> Vendors with limited access or non-sensitive roles",
          "<strong>Low:</strong> Vendors with no data access or system connectivity",
        ]},
        { heading: "3. Assessment Requirements", sub_items: [
          "<strong>Critical vendors:</strong> annual security assessment, SOC 2 report review, contractual security requirements",
          "<strong>Standard vendors:</strong> security questionnaire review, contractual data protection terms",
          "<strong>Low vendors:</strong> basic due diligence only",
        ]},
        { heading: "4. Contractual Requirements", sub_items: [
          "Data processing agreements (DPAs) where applicable",
          "Security incident notification requirements (within 24–72 hours of detection)",
          "Right to audit clause",
          "Data return/destruction upon contract termination",
          cfg.industry === "healthcare" ? "Business Associate Agreements (BAA) for any vendor with PHI access" : null,
          cfg.frameworks.includes("pci") ? "PCI DSS responsibility matrix for any vendor in cardholder data flow" : null,
          "Compliance with applicable regulations (GDPR, CCPA, etc.)",
        ].filter(Boolean) },
        { heading: "5. Ongoing Monitoring", content: "Critical vendors reviewed annually. Security incidents involving vendors trigger immediate reassessment. Vendor inventory maintained in CMDB or equivalent system." },
      ],
    }),

    encryption: (cfg) => ({
      title: `${cfg.organization_name} — Encryption Policy`,
      metadata: { policy_type: "encryption", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Define encryption requirements to protect ${cfg.organization_name}'s data confidentiality and integrity.` },
        { heading: "2. Data at Rest", sub_items: [
          "RESTRICTED and CONFIDENTIAL data must be encrypted at rest",
          "Minimum: AES-256 for symmetric encryption",
          "Full disk encryption required on all endpoints",
          "Database encryption (TDE or field-level) for sensitive data",
          cfg.frameworks.includes("pci") ? "Cardholder data: encrypted at rest using strong cryptography (AES-256), keys managed per PCI DSS req. 3.6" : null,
          cfg.industry === "healthcare" ? "ePHI: encryption applied per HIPAA Security Rule 164.312(a)(2)(iv)" : null,
        ].filter(Boolean) },
        { heading: "3. Data in Transit", sub_items: [
          "TLS 1.2 minimum for all network communications (TLS 1.3 preferred)",
          "Internal service-to-service: mTLS where feasible",
          "VPN for remote access to internal networks",
          "Email encryption for CONFIDENTIAL/RESTRICTED data",
          cfg.frameworks.includes("pci") ? "PCI 4.0 requires TLS 1.2+ — TLS 1.0/1.1 prohibited" : null,
        ].filter(Boolean) },
        { heading: "4. Key Management", sub_items: [
          "Encryption keys stored in dedicated key management system (KMS)",
          "Key rotation: annually minimum, immediately if compromised",
          "Key access logged and audited",
          "Separation of duties between key custodians",
          "Hardware security modules (HSMs) for highest-value keys",
        ]},
        { heading: "5. Prohibited", sub_items: [
          "No custom/proprietary encryption algorithms",
          "No deprecated algorithms (DES, 3DES, RC4, MD5 for integrity)",
          "No hardcoded keys in source code",
          "No key transmission via unencrypted channels",
          "No client-controlled encryption that prevents authorized access",
        ]},
      ],
    }),

    business_continuity: (cfg) => ({
      title: `${cfg.organization_name} — Business Continuity Policy`,
      metadata: { policy_type: "business_continuity", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Ensure ${cfg.organization_name} can maintain critical business operations during and after a disruptive event.` },
        { heading: "2. Recovery Objectives", sub_items: [
          "<strong>RTO (Recovery Time Objective):</strong> Maximum acceptable downtime for critical systems",
          "<strong>RPO (Recovery Point Objective):</strong> Maximum acceptable data loss measured in time",
          "<strong>Critical systems:</strong> RTO 4 hours / RPO 1 hour",
          "<strong>Standard systems:</strong> RTO 24 hours / RPO 24 hours",
        ]},
        { heading: "3. Backup Requirements", sub_items: [
          "Critical data: daily backups, retained 90 days minimum",
          "Backups stored in geographically separate location",
          "Backup restoration tested quarterly",
          "Encryption required for all backup data",
          "Offline/immutable copy for ransomware resilience",
        ]},
        { heading: "4. Disaster Recovery", sub_items: [
          "DR plan documented and maintained for critical systems",
          "Annual DR test (full failover for critical systems)",
          "Contact tree updated quarterly",
          "Alternate work locations identified",
        ]},
        { heading: "5. Testing", content: `BC/DR plans tested annually. ${cfg.org_size === "large" ? "Full failover test required." : "Tabletop exercise minimum; full test recommended."} Test results documented and used to update plans.` },
      ],
    }),

    remote_work: (cfg) => ({
      title: `${cfg.organization_name} — Remote Work Security Policy`,
      metadata: { policy_type: "remote_work", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Define security requirements for ${cfg.organization_name} employees working remotely.` },
        { heading: "2. Network Security", sub_items: [
          "VPN required for accessing internal resources",
          "Home WiFi must use WPA2/WPA3 encryption",
          "Public WiFi prohibited for work without VPN",
          "Split tunneling disabled on company devices",
        ]},
        { heading: "3. Device Security", sub_items: [
          "Company-managed devices required for accessing company data",
          "Full disk encryption enabled",
          "Automatic screen lock after 5 minutes",
          "Current antivirus/EDR agent running",
          "Automatic OS and application updates enabled",
        ]},
        { heading: "4. Physical Security", sub_items: [
          "Lock screen when stepping away",
          "No work on screens visible to others in public",
          "Sensitive documents shredded, not recycled",
          "Secure home office space recommended for calls with sensitive content",
        ]},
        { heading: "5. Data Handling", sub_items: [
          "No company data stored on personal devices",
          "Cloud storage via approved services only",
          "Printing CONFIDENTIAL/RESTRICTED documents requires approval",
          "Virtual desktop recommended for sensitive operations",
        ]},
      ],
    }),

    byod: (cfg) => ({
      title: `${cfg.organization_name} — Bring Your Own Device (BYOD) Policy`,
      metadata: { policy_type: "byod", ...meta(cfg.organization_name, cfg.frameworks) },
      sections: [
        { heading: "1. Purpose", content: `Define requirements and restrictions for using personal devices to access ${cfg.organization_name}'s resources.` },
        { heading: "2. Eligible Devices", sub_items: [
          "Smartphones (iOS 16+, Android 13+)",
          "Tablets (same OS requirements)",
          "Laptops: case-by-case with IT approval",
          "Minimum security patch level: within 30 days of latest",
        ]},
        { heading: "3. Required Security Controls", sub_items: [
          "Device passcode/biometric lock enabled",
          "Device encryption enabled",
          "Remote wipe capability (MDM enrollment)",
          "No jailbroken/rooted devices",
          "Automatic OS updates enabled",
        ]},
        { heading: "4. Access Limitations", sub_items: [
          "BYOD access limited to email, calendar, and approved cloud apps",
          "No access to RESTRICTED data from personal devices",
          "Company reserves right to remote wipe company data (not personal data)",
          "VPN required for intranet access",
        ]},
        { heading: "5. Employee Responsibilities", sub_items: [
          "Report lost/stolen devices immediately",
          "Remove company data upon separation",
          "Allow IT to verify compliance",
          "Accept that company may remotely wipe company data container",
        ]},
      ],
    }),
  };

  function generate(cfg) {
    const fn = TEMPLATES[cfg.policy_type] || TEMPLATES.incident_response;
    return fn(cfg);
  }

  function toMarkdown(policy) {
    let md = `# ${policy.title}\n\n`;
    md += `> Effective: ${policy.metadata.effective_date} · Owner: ${policy.metadata.owner} · Version ${policy.metadata.version}\n`;
    md += `> Frameworks: ${policy.metadata.applicable_frameworks.join(", ").toUpperCase()}\n\n`;
    md += `---\n\n`;
    for (const section of policy.sections) {
      md += `## ${section.heading}\n\n`;
      if (section.content) md += `${section.content.replace(/<[^>]+>/g, "")}\n\n`;
      if (section.sub_items?.length) {
        for (const item of section.sub_items) {
          md += `- ${item.replace(/<[^>]+>/g, "")}\n`;
        }
        md += `\n`;
      }
    }
    md += `---\n\n*Generated by AgentAegis · agentaegis.com*\n`;
    return md;
  }

  window.AgentAegisPolicies = { generate, toMarkdown };
})();
